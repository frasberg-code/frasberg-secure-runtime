import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Maps browser keycodes to X11 keysyms
const KEY_MAP = {
  "ArrowUp":    "Up",
  "ArrowDown":  "Down",
  "ArrowLeft":  "Left",
  "ArrowRight": "Right",
  "Space":      "space",
  "Enter":      "Return",
  "Escape":     "Escape",
  "KeyW":       "w",
  "KeyA":       "a",
  "KeyS":       "s",
  "KeyD":       "d",
  "KeyE":       "e",
  "KeyR":       "r",
  "ShiftLeft":  "Shift_L",
  "ControlLeft":"Control_L",
};

export async function handleKeyEvent(displayId, key, type) {
  const keysym = KEY_MAP[key] || key.toLowerCase();

  if (type === "keydown") {
    try {
      await execAsync(`DISPLAY=:${displayId} xdotool key --clearmodifiers ${keysym}`);
    } catch (e) {
      // Non-fatal — key may not be mapped
    }
  }
}

export async function handleMouseMove(displayId, x, y) {
  try {
    await execAsync(`DISPLAY=:${displayId} xdotool mousemove ${x} ${y}`);
  } catch (_) {}
}

export async function handleMouseClick(displayId, button, type) {
  const btn = button === 0 ? 1 : button === 2 ? 3 : 2;
  const action = type === "mousedown" ? "mousedown" : "mouseup";
  try {
    await execAsync(`DISPLAY=:${displayId} xdotool ${action} ${btn}`);
  } catch (_) {}
}
