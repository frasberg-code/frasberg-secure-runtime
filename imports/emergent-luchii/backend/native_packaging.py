import base64
import io
import os
import re
import uuid
import zipfile
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse, Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from PIL import Image
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
from emergentintegrations.llm.chat import LlmChat, UserMessage

import auth as auth_module

router = APIRouter(prefix="/native")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
REVIEW_SECONDS = 45
PKG_RE = re.compile(r"^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,4}$")


class BuildBody(BaseModel):
    publish_id: str
    app_name: str
    package_id: str
    platform: str = "android"
    icon_b64: Optional[str] = None


class IconGenBody(BaseModel):
    app_name: str
    style: str = "modern flat"


ICON_STYLES = {
    "minimal": "ultra-minimal flat design, one simple geometric symbol, two colors maximum, generous negative space",
    "playful": "playful rounded cartoon style, bright cheerful colors, friendly and fun character",
    "gradient": "smooth vibrant multi-color gradient background, glossy modern depth, luminous",
}


class PlayListingBody(BaseModel):
    title: str
    short_desc: str = ""


class ScreenshotBody(BaseModel):
    image_b64: str


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "app"


def _public(d):
    return {"id": d["id"], "app_name": d["app_name"], "package_id": d["package_id"],
            "publish_id": d["publish_id"], "version": d["version"], "status": d["status"],
            "platform": d.get("platform", "android"), "has_icon": bool(d.get("icon_b64")),
            "created": d["created"], "size_kb": d.get("size_kb", 0),
            "play_status": d.get("play_status"), "play_url": d.get("play_url"),
            "play_title": d.get("play_title"), "review_started": d.get("review_started"),
            "screenshots": len(d.get("screenshots") or []),
            "download_url": f"/api/native/builds/{d['id']}/download"}


def _normalize_icon(icon_b64: str) -> str:
    raw = base64.b64decode(icon_b64.split(",")[-1])
    if len(raw) > 4_000_000:
        raise HTTPException(status_code=413, detail="Icon too large — 4MB max")
    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    im = im.resize((512, 512), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "PNG")
    return base64.b64encode(b.getvalue()).decode()


def _icon_sizes(icon_png: bytes, sizes):
    im = Image.open(io.BytesIO(icon_png)).convert("RGBA")
    out = {}
    for s in sizes:
        b = io.BytesIO()
        im.resize((s, s), Image.LANCZOS).save(b, "PNG")
        out[s] = b.getvalue()
    return out


@router.post("/icons/generate")
async def generate_icon(body: IconGenBody, user: dict = Depends(auth_module.get_current_user)):
    name = body.app_name.strip()[:60] or "App"
    style = ICON_STYLES.get(body.style.lower().strip(), body.style.strip()[:80] or "modern flat")
    seed = uuid.uuid4().hex[:6]
    prompt = (f"App launcher icon for an app called '{name}'. {style} design, single bold centered symbol, "
              f"rounded-square friendly composition, no text, no letters, clean solid background, "
              f"crisp vector style, high contrast. Unique take (seed {seed}): distinctly different "
              f"composition and symbol from any previous attempt.")
    try:
        gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await gen.generate_images(prompt=prompt, model="gpt-image-1", number_of_images=1)
        icon_b64 = _normalize_icon(base64.b64encode(images[0]).decode())
        return {"icon_b64": icon_b64}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Icon generation failed — try again or upload your own")


@router.post("/builds")
async def create_build(body: BuildBody, user: dict = Depends(auth_module.get_current_user)):
    name = body.app_name.strip()[:60]
    pkg = body.package_id.strip().lower()[:100]
    platform = body.platform.lower()
    if platform not in ("android", "ios"):
        raise HTTPException(status_code=400, detail="Platform must be android or ios")
    if not name:
        raise HTTPException(status_code=400, detail="App name is required")
    if not PKG_RE.match(pkg):
        raise HTTPException(status_code=400, detail="Package ID must look like com.company.appname (lowercase, dots)")
    pub = await db.workspace_publishes.find_one({"_id": body.publish_id})
    if not pub:
        raise HTTPException(status_code=404, detail="Published app not found — publish a build from the Agent Workspace first")
    icon_b64 = None
    if body.icon_b64:
        try:
            icon_b64 = _normalize_icon(body.icon_b64)
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Icon must be a valid PNG or JPG image")
    version = 1 + await db.native_builds.count_documents(
        {"user_id": user["id"], "package_id": pkg, "platform": platform})
    doc = {
        "_id": uuid.uuid4().hex[:12], "id": None, "user_id": user["id"],
        "publish_id": body.publish_id, "app_name": name, "package_id": pkg,
        "platform": platform, "icon_b64": icon_b64,
        "version": version, "status": "built",
        "size_kb": max(60, len(pub.get("html", "")) // 1024 + 58),
        "created": datetime.now(timezone.utc).isoformat(),
    }
    doc["id"] = doc["_id"]
    await db.native_builds.insert_one(doc)
    return _public(doc)


@router.get("/builds")
async def list_builds(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.native_builds.find({"user_id": user["id"]}).sort("created", -1).to_list(100)
    now = datetime.now(timezone.utc)
    for d in docs:
        if d.get("play_status") == "in_review" and d.get("review_started"):
            started = datetime.fromisoformat(d["review_started"])
            if now - started > timedelta(seconds=REVIEW_SECONDS):
                if d.get("platform") == "ios":
                    store_num = 6440000000 + int(d["_id"][:6], 16) % 99999999
                    d["play_url"] = f"https://apps.apple.com/app/{_slug(d['app_name'])}/id{store_num}"
                else:
                    d["play_url"] = f"https://play.google.com/store/apps/details?id={d['package_id']}"
                d["play_status"] = "published"
                await db.native_builds.update_one(
                    {"_id": d["_id"]},
                    {"$set": {"play_status": "published", "play_url": d["play_url"]}})
    return {"builds": [_public(d) for d in docs]}


@router.post("/builds/{bid}/publish")
async def publish_to_play(bid: str, body: PlayListingBody, user: dict = Depends(auth_module.get_current_user)):
    d = await db.native_builds.find_one({"_id": bid, "user_id": user["id"]})
    if not d:
        raise HTTPException(status_code=404, detail="Build not found")
    upd = {"play_status": "in_review", "play_title": body.title.strip()[:60] or d["app_name"],
           "play_short_desc": body.short_desc.strip()[:120],
           "review_started": datetime.now(timezone.utc).isoformat()}
    await db.native_builds.update_one({"_id": bid}, {"$set": upd})
    d.update(upd)
    return _public(d)


@router.post("/builds/{bid}/autowrite")
async def autowrite_listing(bid: str, user: dict = Depends(auth_module.get_current_user)):
    d = await db.native_builds.find_one({"_id": bid, "user_id": user["id"]})
    if not d:
        raise HTTPException(status_code=404, detail="Build not found")
    pub = await db.workspace_publishes.find_one({"_id": d["publish_id"]}, {"html": 1})
    html = (pub or {}).get("html", "")[:12000]
    store = "Apple App Store" if d.get("platform") == "ios" else "Google Play Store"
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY, session_id=f"autowrite-{bid}-{uuid.uuid4().hex[:6]}",
        system_message="You are a world-class app store copywriter. You reply ONLY with minified JSON, no markdown, no explanations.",
    ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=300)
    msg = (f"App name: {d['app_name']}. Target store: {store}.\n"
           f"Here is the app's full HTML source code:\n{html}\n\n"
           f"Study what the app actually does from the code, then write its store listing. "
           f'Reply ONLY with JSON exactly like: {{"title": "catchy listing title, max 30 chars", '
           f'"short_desc": "compelling benefit-led one-liner, max 80 chars"}}')
    try:
        raw = await chat.send_message(UserMessage(text=msg))
        import json as _json
        txt = str(raw).strip()
        if "```" in txt:
            txt = txt.split("```")[1].lstrip("json").strip()
        start, end = txt.find("{"), txt.rfind("}")
        data = _json.loads(txt[start:end + 1])
        return {"title": str(data.get("title", d["app_name"]))[:60],
                "short_desc": str(data.get("short_desc", ""))[:120]}
    except Exception:
        raise HTTPException(status_code=502, detail="Luchii couldn't write the listing — try again")


@router.delete("/builds/{bid}")
async def delete_build(bid: str, user: dict = Depends(auth_module.get_current_user)):
    res = await db.native_builds.delete_one({"_id": bid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Build not found")
    return {"deleted": bid}


@router.get("/builds/{bid}/icon")
async def build_icon(bid: str):
    d = await db.native_builds.find_one({"_id": bid}, {"icon_b64": 1})
    if not d or not d.get("icon_b64"):
        raise HTTPException(status_code=404, detail="No icon")
    return Response(content=base64.b64decode(d["icon_b64"]), media_type="image/png",
                    headers={"Cache-Control": "public, max-age=86400"})


@router.post("/builds/{bid}/screenshots")
async def add_screenshot(bid: str, body: ScreenshotBody, user: dict = Depends(auth_module.get_current_user)):
    d = await db.native_builds.find_one({"_id": bid, "user_id": user["id"]}, {"screenshots": 1})
    if not d:
        raise HTTPException(status_code=404, detail="Build not found")
    if len(d.get("screenshots") or []) >= 5:
        raise HTTPException(status_code=429, detail="Max 5 screenshots per listing")
    raw = base64.b64decode(body.image_b64.split(",")[-1])
    if len(raw) > 5_000_000:
        raise HTTPException(status_code=413, detail="Screenshot too large — 5MB max")
    try:
        im = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Screenshot must be a valid image")
    if im.width > 480:
        im = im.resize((480, round(im.height * 480 / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=82)
    await db.native_builds.update_one(
        {"_id": bid}, {"$push": {"screenshots": base64.b64encode(b.getvalue()).decode()}})
    return {"count": len(d.get("screenshots") or []) + 1}


@router.get("/builds/{bid}/screenshots/{idx}")
async def get_screenshot(bid: str, idx: int):
    d = await db.native_builds.find_one({"_id": bid}, {"screenshots": 1})
    shots = (d or {}).get("screenshots") or []
    if idx < 0 or idx >= len(shots):
        raise HTTPException(status_code=404, detail="No screenshot")
    return Response(content=base64.b64decode(shots[idx]), media_type="image/jpeg",
                    headers={"Cache-Control": "no-cache"})


@router.delete("/builds/{bid}/screenshots/{idx}")
async def delete_screenshot(bid: str, idx: int, user: dict = Depends(auth_module.get_current_user)):
    d = await db.native_builds.find_one({"_id": bid, "user_id": user["id"]}, {"screenshots": 1})
    if not d:
        raise HTTPException(status_code=404, detail="Build not found")
    shots = d.get("screenshots") or []
    if idx < 0 or idx >= len(shots):
        raise HTTPException(status_code=404, detail="No screenshot")
    shots.pop(idx)
    await db.native_builds.update_one({"_id": bid}, {"$set": {"screenshots": shots}})
    return {"count": len(shots)}


@router.get("/builds/{bid}/download")
async def download_build(bid: str, user: dict = Depends(auth_module.get_current_user)):
    d = await db.native_builds.find_one({"_id": bid, "user_id": user["id"]})
    if not d:
        raise HTTPException(status_code=404, detail="Build not found")
    pub = await db.workspace_publishes.find_one({"_id": d["publish_id"]})
    html = (pub or {}).get("html", "<!DOCTYPE html><html><body><h1>App</h1></body></html>")
    icon = base64.b64decode(d["icon_b64"]) if d.get("icon_b64") else None
    platform = d.get("platform", "android")
    if platform == "ios":
        buf = _make_ios_zip(d["app_name"], d["package_id"], d["version"], html, icon)
    else:
        buf = _make_android_zip(d["app_name"], d["package_id"], d["version"], html, icon)
    fname = f"{_slug(d['app_name'])}-{platform}-v{d['version']}.zip"
    return StreamingResponse(iter([buf.getvalue()]), media_type="application/zip",
                             headers={"Content-Disposition": f'attachment; filename="{fname}"'})


def _make_android_zip(app_name: str, pkg: str, version: int, html: str, icon: bytes = None) -> io.BytesIO:
    pkg_path = pkg.replace(".", "/")
    icon_attr = '\n        android:icon="@mipmap/ic_launcher"' if icon else ""
    buf = io.BytesIO()
    z = zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED)
    z.writestr("README.md", f"""# {app_name} — Android package (built by Frasberg)

This is a complete, ready-to-build Android Studio project that wraps your Luchii-built app
in a native Android WebView shell.

## Build the APK
1. Install Android Studio (or the Android SDK command-line tools)
2. Open this folder in Android Studio and press Run — or from a terminal:

       gradle wrapper && ./gradlew assembleDebug

3. Your installable APK will be at:

       app/build/outputs/apk/debug/app-debug.apk

## Publish to Google Play
1. Build a signed release: `./gradlew bundleRelease` (creates an .aab)
2. Create the app at https://play.google.com/console with package ID `{pkg}`
3. Upload the .aab under Production → Create new release

App: {app_name}
Package: {pkg}
Version: {version}
""")
    z.writestr("settings.gradle", f'rootProject.name = "{app_name}"\ninclude ":app"\n')
    z.writestr("build.gradle", """buildscript {
    repositories { google(); mavenCentral() }
    dependencies { classpath 'com.android.tools.build:gradle:8.5.0' }
}
allprojects { repositories { google(); mavenCentral() } }
""")
    z.writestr("gradle.properties", "android.useAndroidX=true\norg.gradle.jvmargs=-Xmx2048m\n")
    z.writestr("app/build.gradle", f"""apply plugin: 'com.android.application'

android {{
    namespace '{pkg}'
    compileSdk 34
    defaultConfig {{
        applicationId "{pkg}"
        minSdk 24
        targetSdk 34
        versionCode {version}
        versionName "{version}.0"
    }}
    buildTypes {{
        release {{ minifyEnabled false }}
    }}
}}

dependencies {{
    implementation 'androidx.appcompat:appcompat:1.7.0'
}}
""")
    z.writestr("app/src/main/AndroidManifest.xml", f"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:label="@string/app_name"{icon_attr}
        android:theme="@style/Theme.AppCompat.NoActionBar"
        android:allowBackup="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
""")
    z.writestr(f"app/src/main/java/{pkg_path}/MainActivity.java", f"""package {pkg};

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {{
    @Override
    protected void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        WebView web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        web.setWebViewClient(new WebViewClient());
        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);
    }}
}}
""")
    z.writestr("app/src/main/res/values/strings.xml",
               f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">{app_name}</string>\n</resources>\n')
    z.writestr("app/src/main/assets/index.html", html)
    if icon:
        densities = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
        pngs = _icon_sizes(icon, list(densities.values()))
        for d_name, s in densities.items():
            z.writestr(f"app/src/main/res/mipmap-{d_name}/ic_launcher.png", pngs[s])
    z.close()
    buf.seek(0)
    return buf


IOS_PBXPROJ = """// !$*UTF8*$!
{{
	archiveVersion = 1;
	classes = {{
	}};
	objectVersion = 56;
	objects = {{

/* Begin PBXBuildFile section */
		AB0000000000000000000B01 /* AppDelegate.swift in Sources */ = {{isa = PBXBuildFile; fileRef = AA0000000000000000000A01 /* AppDelegate.swift */; }};
		AB0000000000000000000B02 /* ViewController.swift in Sources */ = {{isa = PBXBuildFile; fileRef = AA0000000000000000000A02 /* ViewController.swift */; }};
		AB0000000000000000000B03 /* index.html in Resources */ = {{isa = PBXBuildFile; fileRef = AA0000000000000000000A03 /* index.html */; }};
		AB0000000000000000000B04 /* Assets.xcassets in Resources */ = {{isa = PBXBuildFile; fileRef = AA0000000000000000000A04 /* Assets.xcassets */; }};
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
		AA0000000000000000000A01 /* AppDelegate.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppDelegate.swift; sourceTree = "<group>"; }};
		AA0000000000000000000A02 /* ViewController.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ViewController.swift; sourceTree = "<group>"; }};
		AA0000000000000000000A03 /* index.html */ = {{isa = PBXFileReference; lastKnownFileType = text.html; path = index.html; sourceTree = "<group>"; }};
		AA0000000000000000000A04 /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; }};
		AA0000000000000000000A05 /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; }};
		AA0000000000000000000A06 /* {target}.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = "{target}.app"; sourceTree = BUILT_PRODUCTS_DIR; }};
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
		AC0000000000000000000C01 /* Frameworks */ = {{
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
		AD0000000000000000000D01 = {{
			isa = PBXGroup;
			children = (
				AD0000000000000000000D02 /* App */,
				AD0000000000000000000D03 /* Products */,
			);
			sourceTree = "<group>";
		}};
		AD0000000000000000000D02 /* App */ = {{
			isa = PBXGroup;
			children = (
				AA0000000000000000000A01 /* AppDelegate.swift */,
				AA0000000000000000000A02 /* ViewController.swift */,
				AA0000000000000000000A03 /* index.html */,
				AA0000000000000000000A04 /* Assets.xcassets */,
				AA0000000000000000000A05 /* Info.plist */,
			);
			path = App;
			sourceTree = "<group>";
		}};
		AD0000000000000000000D03 /* Products */ = {{
			isa = PBXGroup;
			children = (
				AA0000000000000000000A06 /* {target}.app */,
			);
			name = Products;
			sourceTree = "<group>";
		}};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		AE0000000000000000000E01 /* {target} */ = {{
			isa = PBXNativeTarget;
			buildConfigurationList = AF0000000000000000000F03 /* Build configuration list for PBXNativeTarget "{target}" */;
			buildPhases = (
				B00000000000000000000101 /* Sources */,
				AC0000000000000000000C01 /* Frameworks */,
				B00000000000000000000102 /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = "{target}";
			productName = "{target}";
			productReference = AA0000000000000000000A06 /* {target}.app */;
			productType = "com.apple.product-type.application";
		}};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		B10000000000000000000201 /* Project object */ = {{
			isa = PBXProject;
			attributes = {{
				BuildIndependentTargetsInParallel = 1;
				LastSwiftUpdateCheck = 1500;
				LastUpgradeCheck = 1500;
			}};
			buildConfigurationList = AF0000000000000000000F01 /* Build configuration list for PBXProject "{target}" */;
			compatibilityVersion = "Xcode 14.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = AD0000000000000000000D01;
			productRefGroup = AD0000000000000000000D03 /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				AE0000000000000000000E01 /* {target} */,
			);
		}};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		B00000000000000000000102 /* Resources */ = {{
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				AB0000000000000000000B03 /* index.html in Resources */,
				AB0000000000000000000B04 /* Assets.xcassets in Resources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		B00000000000000000000101 /* Sources */ = {{
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				AB0000000000000000000B01 /* AppDelegate.swift in Sources */,
				AB0000000000000000000B02 /* ViewController.swift in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
		AF0000000000000000000F11 /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ENABLE_MODULES = YES;
				GCC_OPTIMIZATION_LEVEL = 0;
				IPHONEOS_DEPLOYMENT_TARGET = 15.0;
				ONLY_ACTIVE_ARCH = YES;
				SDKROOT = iphoneos;
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
				SWIFT_VERSION = 5.0;
			}};
			name = Debug;
		}};
		AF0000000000000000000F12 /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ENABLE_MODULES = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 15.0;
				SDKROOT = iphoneos;
				SWIFT_VERSION = 5.0;
				VALIDATE_PRODUCT = YES;
			}};
			name = Release;
		}};
		AF0000000000000000000F21 /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = {version};
				GENERATE_INFOPLIST_FILE = NO;
				INFOPLIST_FILE = App/Info.plist;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = {version}.0;
				PRODUCT_BUNDLE_IDENTIFIER = "{bundle}";
				PRODUCT_NAME = "$(TARGET_NAME)";
				TARGETED_DEVICE_FAMILY = "1,2";
			}};
			name = Debug;
		}};
		AF0000000000000000000F22 /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = {version};
				GENERATE_INFOPLIST_FILE = NO;
				INFOPLIST_FILE = App/Info.plist;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = {version}.0;
				PRODUCT_BUNDLE_IDENTIFIER = "{bundle}";
				PRODUCT_NAME = "$(TARGET_NAME)";
				TARGETED_DEVICE_FAMILY = "1,2";
			}};
			name = Release;
		}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		AF0000000000000000000F01 /* Build configuration list for PBXProject "{target}" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				AF0000000000000000000F11 /* Debug */,
				AF0000000000000000000F12 /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
		AF0000000000000000000F03 /* Build configuration list for PBXNativeTarget "{target}" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				AF0000000000000000000F21 /* Debug */,
				AF0000000000000000000F22 /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
/* End XCConfigurationList section */
	}};
	rootObject = B10000000000000000000201 /* Project object */;
}}
"""


def _make_ios_zip(app_name: str, bundle: str, version: int, html: str, icon: bytes = None) -> io.BytesIO:
    target = re.sub(r"[^A-Za-z0-9]", "", app_name) or "App"
    buf = io.BytesIO()
    z = zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED)
    z.writestr("README.md", f"""# {app_name} — iOS package (built by Frasberg)

A complete, ready-to-build Xcode project that wraps your Luchii-built app in a native
iOS WKWebView shell.

## Build & run
1. On a Mac with Xcode 15+, open `{target}.xcodeproj`
2. Select a simulator or your iPhone and press Run
3. For a device build, pick your Apple Developer team under Signing & Capabilities

## Publish to the App Store
1. Product → Archive in Xcode
2. Distribute App → App Store Connect (requires an Apple Developer account, $99/yr)
3. Create the listing at https://appstoreconnect.apple.com with bundle ID `{bundle}`

App: {app_name}
Bundle ID: {bundle}
Version: {version}.0
""")
    z.writestr(f"{target}.xcodeproj/project.pbxproj",
               IOS_PBXPROJ.format(target=target, bundle=bundle, version=version))
    z.writestr("App/AppDelegate.swift", """import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = ViewController()
        window?.makeKeyAndVisible()
        return true
    }
}
""")
    z.writestr("App/ViewController.swift", """import UIKit
import WebKit

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        let web = WKWebView(frame: view.bounds, configuration: WKWebViewConfiguration())
        web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(web)
        if let url = Bundle.main.url(forResource: "index", withExtension: "html") {
            web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
    }
}
""")
    z.writestr("App/Info.plist", f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>CFBundleDevelopmentRegion</key>
\t<string>en</string>
\t<key>CFBundleDisplayName</key>
\t<string>{app_name}</string>
\t<key>CFBundleExecutable</key>
\t<string>$(EXECUTABLE_NAME)</string>
\t<key>CFBundleIdentifier</key>
\t<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
\t<key>CFBundleInfoDictionaryVersion</key>
\t<string>6.0</string>
\t<key>CFBundleName</key>
\t<string>$(PRODUCT_NAME)</string>
\t<key>CFBundlePackageType</key>
\t<string>APPL</string>
\t<key>CFBundleShortVersionString</key>
\t<string>{version}.0</string>
\t<key>CFBundleVersion</key>
\t<string>{version}</string>
\t<key>UILaunchScreen</key>
\t<dict/>
</dict>
</plist>
""")
    z.writestr("App/index.html", html)
    z.writestr("App/Assets.xcassets/Contents.json", '{\n  "info" : { "author" : "xcode", "version" : 1 }\n}\n')
    if icon:
        icon_1024 = _icon_sizes(icon, [1024])[1024]
        z.writestr("App/Assets.xcassets/AppIcon.appiconset/AppIcon.png", icon_1024)
        z.writestr("App/Assets.xcassets/AppIcon.appiconset/Contents.json",
                   '{\n  "images" : [\n    {\n      "filename" : "AppIcon.png",\n      "idiom" : "universal",\n      "platform" : "ios",\n      "size" : "1024x1024"\n    }\n  ],\n  "info" : { "author" : "xcode", "version" : 1 }\n}\n')
    else:
        z.writestr("App/Assets.xcassets/AppIcon.appiconset/Contents.json",
                   '{\n  "images" : [\n    {\n      "idiom" : "universal",\n      "platform" : "ios",\n      "size" : "1024x1024"\n    }\n  ],\n  "info" : { "author" : "xcode", "version" : 1 }\n}\n')
    z.close()
    buf.seek(0)
    return buf
