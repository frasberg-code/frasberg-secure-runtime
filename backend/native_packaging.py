import io
import os
import re
import uuid
import zipfile
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

import auth as auth_module

router = APIRouter(prefix="/native")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

REVIEW_SECONDS = 45
PKG_RE = re.compile(r"^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,4}$")


class BuildBody(BaseModel):
    publish_id: str
    app_name: str
    package_id: str


class PlayListingBody(BaseModel):
    title: str
    short_desc: str = ""


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "app"


def _public(d):
    return {"id": d["id"], "app_name": d["app_name"], "package_id": d["package_id"],
            "publish_id": d["publish_id"], "version": d["version"], "status": d["status"],
            "created": d["created"], "size_kb": d.get("size_kb", 0),
            "play_status": d.get("play_status"), "play_url": d.get("play_url"),
            "play_title": d.get("play_title"), "review_started": d.get("review_started"),
            "download_url": f"/api/native/builds/{d['id']}/download"}


@router.post("/builds")
async def create_build(body: BuildBody, user: dict = Depends(auth_module.get_current_user)):
    name = body.app_name.strip()[:60]
    pkg = body.package_id.strip().lower()[:100]
    if not name:
        raise HTTPException(status_code=400, detail="App name is required")
    if not PKG_RE.match(pkg):
        raise HTTPException(status_code=400, detail="Package ID must look like com.company.appname (lowercase, dots)")
    pub = await db.workspace_publishes.find_one({"_id": body.publish_id})
    if not pub:
        raise HTTPException(status_code=404, detail="Published app not found — publish a build from the Agent Workspace first")
    version = 1 + await db.native_builds.count_documents({"user_id": user["id"], "package_id": pkg})
    doc = {
        "_id": uuid.uuid4().hex[:12], "id": None, "user_id": user["id"],
        "publish_id": body.publish_id, "app_name": name, "package_id": pkg,
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
                d["play_status"] = "published"
                d["play_url"] = f"https://play.google.com/store/apps/details?id={d['package_id']}"
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


@router.delete("/builds/{bid}")
async def delete_build(bid: str, user: dict = Depends(auth_module.get_current_user)):
    res = await db.native_builds.delete_one({"_id": bid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Build not found")
    return {"deleted": bid}


@router.get("/builds/{bid}/download")
async def download_build(bid: str, user: dict = Depends(auth_module.get_current_user)):
    d = await db.native_builds.find_one({"_id": bid, "user_id": user["id"]})
    if not d:
        raise HTTPException(status_code=404, detail="Build not found")
    pub = await db.workspace_publishes.find_one({"_id": d["publish_id"]})
    html = (pub or {}).get("html", "<!DOCTYPE html><html><body><h1>App</h1></body></html>")
    buf = _make_android_zip(d["app_name"], d["package_id"], d["version"], html)
    fname = f"{_slug(d['app_name'])}-android-v{d['version']}.zip"
    return StreamingResponse(iter([buf.getvalue()]), media_type="application/zip",
                             headers={"Content-Disposition": f'attachment; filename="{fname}"'})


def _make_android_zip(app_name: str, pkg: str, version: int, html: str) -> io.BytesIO:
    pkg_path = pkg.replace(".", "/")
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
        android:label="@string/app_name"
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
    z.close()
    buf.seek(0)
    return buf
