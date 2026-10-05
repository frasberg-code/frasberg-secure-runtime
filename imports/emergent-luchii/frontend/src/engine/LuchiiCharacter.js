// Luchii Game Engine — Layer 3: First Person Controller
export class LuchiiCharacter {
  constructor(camera, physicsBody, physics) {
    this.camera = camera;
    this.body = physicsBody;
    this.physics = physics;
    this.moveSpeed = 8;
    this.jumpForce = 6;
    this.sensitivity = 0.002;

    this.velocity = { x: 0, y: 0, z: 0 };
    this.keys = {};
    this.yaw = 0;
    this.pitch = 0;
    this.grounded = false;

    this.setupControls();
  }

  setupControls() {
    document.addEventListener("keydown", (e) => this.keys[e.code] = true);
    document.addEventListener("keyup", (e) => this.keys[e.code] = false);

    document.addEventListener("mousemove", (e) => {
      if (!document.pointerLockElement) return;
      this.yaw -= e.movementX * this.sensitivity;
      this.pitch -= e.movementY * this.sensitivity;
      this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
    });

    document.addEventListener("click", () => {
      document.body.requestPointerLock();
    });
  }

  update(delta) {
    // Movement direction from yaw
    const forward = {
      x: Math.sin(this.yaw),
      z: Math.cos(this.yaw)
    };
    const right = {
      x: Math.cos(this.yaw),
      z: -Math.sin(this.yaw)
    };

    let dx = 0, dz = 0;

    if (this.keys["KeyW"]) { dx += forward.x; dz += forward.z; }
    if (this.keys["KeyS"]) { dx -= forward.x; dz -= forward.z; }
    if (this.keys["KeyA"]) { dx -= right.x; dz -= right.z; }
    if (this.keys["KeyD"]) { dx += right.x; dz += right.z; }

    // Normalize diagonal movement
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    dx /= len; dz /= len;

    const pos = this.body.translation();
    this.grounded = pos.y <= 1.05;

    // Jump
    if (this.keys["Space"] && this.grounded) {
      this.velocity.y = this.jumpForce;
    }

    // Gravity
    this.velocity.y -= 20 * delta;
    if (this.grounded && this.velocity.y < 0) this.velocity.y = 0;

    // Apply movement
    this.body.setNextKinematicTranslation({
      x: pos.x + dx * this.moveSpeed * delta,
      y: pos.y + this.velocity.y * delta,
      z: pos.z + dz * this.moveSpeed * delta
    });

    // Sync camera
    const newPos = this.body.translation();
    this.camera.position.set(newPos.x, newPos.y + 0.8, newPos.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
