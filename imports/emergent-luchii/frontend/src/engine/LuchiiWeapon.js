// Luchii Game Engine — Layer 6: Weapon System
import * as THREE from "three";

export class LuchiiWeapon {
  constructor(scene, camera, aiSystem) {
    this.scene = scene;
    this.camera = camera;
    this.ai = aiSystem;
    this.damage = 25;
    this.range = 100;
    this.cooldown = 0;
    this.fireRate = 0.1;
    this.ammo = 30;
    this.maxAmmo = 30;

    this.raycaster = new THREE.Raycaster();
    this.muzzleFlash = this.createMuzzleFlash();

    document.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.fire();
    });
    document.addEventListener("keydown", (e) => {
      if (e.code === "KeyR") this.reload();
    });
  }

  createMuzzleFlash() {
    const geo = new THREE.SphereGeometry(0.05);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const flash = new THREE.Mesh(geo, mat);
    flash.visible = false;
    this.scene.add(flash);
    return flash;
  }

  fire() {
    if (this.cooldown > 0 || this.ammo <= 0) return;

    this.cooldown = this.fireRate;
    this.ammo--;

    // Raycast from camera center
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

    const enemyMeshes = this.ai.enemies
      .filter(e => e.state !== "dead")
      .map(e => e.mesh);

    const hits = this.raycaster.intersectObjects(enemyMeshes, true);

    if (hits.length > 0 && hits[0].distance <= this.range) {
      const hitMesh = hits[0].object;
      const enemy = this.ai.enemies.find((e) => e.mesh === hitMesh);
      if (enemy) this.ai.damageEnemy(enemy, this.damage);

      // Impact flash at hit point
      this.muzzleFlash.position.copy(hits[0].point);
      this.muzzleFlash.visible = true;
      setTimeout(() => { this.muzzleFlash.visible = false; }, 50);
    }
  }

  reload() {
    this.ammo = this.maxAmmo;
  }

  update(delta) {
    if (this.cooldown > 0) this.cooldown -= delta;
  }
}
