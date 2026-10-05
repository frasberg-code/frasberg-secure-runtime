// Luchii Game Engine — Layer 5: Enemy AI System
import * as THREE from "three";

export class LuchiiAI {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.enemies = [];
  }

  spawnEnemy(position) {
    // Visual
    const geo = new THREE.CapsuleGeometry(0.4, 1.0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.castShadow = true;
    this.scene.add(mesh);

    const enemy = {
      mesh,
      health: 100,
      speed: 3 + Math.random() * 2,
      state: "patrol",        // patrol | chase | attack | dead
      patrolTarget: position.clone(),
      alertRange: 20,
      attackRange: 2,
      attackCooldown: 0,
      roamTimer: 0
    };

    this.enemies.push(enemy);
    return enemy;
  }

  update(delta, playerPosition) {
    for (const enemy of this.enemies) {
      if (enemy.state === "dead") continue;

      const distToPlayer = enemy.mesh.position.distanceTo(playerPosition);

      // State machine
      if (distToPlayer < enemy.attackRange) {
        enemy.state = "attack";
      } else if (distToPlayer < enemy.alertRange) {
        enemy.state = "chase";
      } else {
        enemy.state = "patrol";
      }

      // Behaviors
      if (enemy.state === "chase") {
        const dir = playerPosition.clone()
          .sub(enemy.mesh.position)
          .normalize();
        enemy.mesh.position.addScaledVector(dir, enemy.speed * delta);
        enemy.mesh.lookAt(playerPosition);
      }

      if (enemy.state === "patrol") {
        enemy.roamTimer -= delta;
        if (enemy.roamTimer <= 0) {
          enemy.patrolTarget.set(
            enemy.mesh.position.x + (Math.random() - 0.5) * 20,
            enemy.mesh.position.y,
            enemy.mesh.position.z + (Math.random() - 0.5) * 20
          );
          enemy.roamTimer = 3 + Math.random() * 4;
        }
        const dir = enemy.patrolTarget.clone()
          .sub(enemy.mesh.position)
          .normalize();
        enemy.mesh.position.addScaledVector(dir, enemy.speed * 0.4 * delta);
      }

      if (enemy.state === "attack") {
        enemy.attackCooldown -= delta;
        if (enemy.attackCooldown <= 0) {
          console.log("💥 Enemy attacks player!");
          enemy.attackCooldown = 1.5;
        }
      }

      // Hit detection
      enemy.mesh.userData.distToPlayer = distToPlayer;
    }
  }

  damageEnemy(enemy, amount) {
    enemy.health -= amount;
    if (enemy.health <= 0) {
      enemy.state = "dead";
      this.scene.remove(enemy.mesh);
    }
  }
}
