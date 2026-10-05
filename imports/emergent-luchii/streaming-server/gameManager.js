import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GAME_REGISTRY = {
  "dungeon3d": {
    id: "dungeon3d",
    name: "Luchii Dungeon 3D",
    path: path.resolve(__dirname, "../games/dungeon3d/index.html"),
    launcher: "chromium-browser",
    args: ["--headless=new", "--no-sandbox", "--disable-gpu-sandbox",
           "--window-size=1280,720", "--use-gl=egl"],
    width: 1280,
    height: 720,
  },
  "racer": {
    id: "racer",
    name: "Luchii Racer",
    path: path.resolve(__dirname, "../games/racer/index.html"),
    launcher: "chromium-browser",
    args: ["--headless=new", "--no-sandbox", "--disable-gpu-sandbox",
           "--window-size=1280,720", "--use-gl=egl"],
    width: 1280,
    height: 720,
  }
};

export function getGameConfig(gameId) {
  return GAME_REGISTRY[gameId] || null;
}

export function getAllGames() {
  return Object.values(GAME_REGISTRY);
}

export async function launchGame(gameId, displayId = 99) {
  const config = getGameConfig(gameId);
  if (!config) throw new Error(`Unknown game: ${gameId}`);

  const env = {
    ...process.env,
    DISPLAY: `:${displayId}`,
  };

  const args = [
    ...config.args,
    `file://${config.path}`
  ];

  const proc = spawn(config.launcher, args, {
    env,
    stdio: ["pipe", "pipe", "pipe"],
    detached: false,
  });

  proc.stdout.on("data", (d) => console.log(`[${gameId}] ${d}`));
  proc.stderr.on("data", (d) => console.error(`[${gameId}] ${d}`));

  proc.on("exit", (code) => {
    console.log(`[${gameId}] Process exited with code ${code}`);
  });

  // Give browser time to launch
  await new Promise((r) => setTimeout(r, 2000));

  return proc;
}
