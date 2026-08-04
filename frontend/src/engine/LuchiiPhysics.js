// Luchii Game Engine — Layer 2: Physics Engine (Rapier.js — same physics as AAA)
import RAPIER from "@dimforge/rapier3d";

export class LuchiiPhysics {
  constructor() {
    this.world = null;
    this.bodies = new Map(); // mesh → rigidBody
  }

  async init() {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  }

  addGround(width = 200, depth = 200) {
    const groundDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(0, 0, 0);
    const groundBody = this.world.createRigidBody(groundDesc);
    const groundCollider = RAPIER.ColliderDesc.cuboid(
      width / 2, 0.1, depth / 2
    );
    this.world.createCollider(groundCollider, groundBody);
    return groundBody;
  }

  addDynamicBox(mesh, mass = 1) {
    const pos = mesh.position;
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(pos.x, pos.y, pos.z);
    const body = this.world.createRigidBody(bodyDesc);
    const collider = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
      .setMass(mass)
      .setRestitution(0.3);
    this.world.createCollider(collider, body);
    this.bodies.set(mesh, body);
    return body;
  }

  addCharacterController(height = 1.8, radius = 0.4) {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(0, 2, 0);
    const body = this.world.createRigidBody(bodyDesc);
    const collider = RAPIER.ColliderDesc.capsule(height / 2, radius);
    this.world.createCollider(collider, body);
    return body;
  }

  step(delta) {
    this.world.timestep = Math.min(delta, 0.016);
    this.world.step();

    // Sync Three.js meshes to physics bodies
    this.bodies.forEach((body, mesh) => {
      const pos = body.translation();
      const rot = body.rotation();
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    });
  }
}
