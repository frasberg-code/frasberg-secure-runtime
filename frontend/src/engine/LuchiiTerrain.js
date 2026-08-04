// Luchii Game Engine — Layer 4: Terrain Generator (Procedural)
import * as THREE from "three";
import { createNoise2D } from "simplex-noise";

export class LuchiiTerrain {
  constructor(scene) {
    this.scene = scene;
    this.noise = createNoise2D();
  }

  generate(size = 200, segments = 128) {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];

      // Layered noise for realistic terrain
      const height =
        this.noise(x * 0.01, z * 0.01) * 20 +
        this.noise(x * 0.05, z * 0.05) * 8 +
        this.noise(x * 0.1, z * 0.1) * 3 +
        this.noise(x * 0.3, z * 0.3) * 1;

      positions[i + 1] = Math.max(0, height);
    }

    geo.computeVertexNormals();

    // Vertex coloring by height
    const colors = [];
    for (let i = 0; i < positions.length; i += 3) {
      const h = positions[i + 1];
      if (h < 1) colors.push(0.2, 0.5, 0.8);        // Water
      else if (h < 4) colors.push(0.7, 0.65, 0.5);  // Sand
      else if (h < 12) colors.push(0.2, 0.5, 0.2);  // Grass
      else if (h < 18) colors.push(0.4, 0.35, 0.3); // Rock
      else colors.push(0.9, 0.9, 0.95);             // Snow
    }

    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }
}
