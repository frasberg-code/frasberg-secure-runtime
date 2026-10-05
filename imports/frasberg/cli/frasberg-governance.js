#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(__dirname, "..", "governance", "mesh-registry.json");

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error("ERROR: mesh-registry.json not found");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

function getMesh() {
  const registry = loadRegistry();
  return registry.current;
}

function bumpMeshVersion(next) {
  const registry = loadRegistry();
  
  registry.history.push({
    meshVersion: registry.current.meshVersion,
    raftTerm: registry.current.raftTerm,
    snapshotVersion: registry.current.snapshotVersion,
    timestamp: new Date().toISOString(),
    reason: "meshVersion bump"
  });

  registry.current.meshVersion = next;
  saveRegistry(registry);
  console.log(`✓ Bumped meshVersion to ${next}`);
}

function bumpRaft() {
  const registry = loadRegistry();
  registry.current.raftTerm += 1;
  registry.history.push({
    meshVersion: registry.current.meshVersion,
    raftTerm: registry.current.raftTerm - 1,
    snapshotVersion: registry.current.snapshotVersion,
    timestamp: new Date().toISOString(),
    reason: "raftTerm bump"
  });
  saveRegistry(registry);
  console.log(`✓ Bumped raftTerm to ${registry.current.raftTerm}`);
}

function setSnapshot(v) {
  const registry = loadRegistry();
  registry.current.snapshotVersion = v;
  registry.history.push({
    meshVersion: registry.current.meshVersion,
    raftTerm: registry.current.raftTerm,
    snapshotVersion: registry.current.snapshotVersion - 1 || "0",
    timestamp: new Date().toISOString(),
    reason: `snapshot update to ${v}`
  });
  saveRegistry(registry);
  console.log(`✓ Set snapshotVersion to ${v}`);
}

function getSyncStatus() {
  const configPath = path.join(__dirname, "..", "governance.config.json");
  if (!fs.existsSync(configPath)) {
    console.log("No governance.config.json found");
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const sync = config.sync || {};

  console.log("Cross-Repo Sync Status:");
  console.log(`  Frasberg Repo: ${sync.frasbergRepo}`);
  console.log(`  Luchii Repo: ${sync.luchiiRepo}`);
  console.log(`  Sync Map: ${sync.mapFile}`);
}

const command = process.argv[2];

switch (command) {
  case "mesh:status":
    console.log("Mesh Status:");
    console.log(JSON.stringify(getMesh(), null, 2));
    break;
  case "mesh:bump-version":
    const nextVersion = process.argv[3];
    if (!nextVersion) {
      console.error("ERROR: mesh:bump-version requires a version argument");
      process.exit(1);
    }
    bumpMeshVersion(nextVersion);
    break;
  case "mesh:bump-raft":
    bumpRaft();
    break;
  case "mesh:set-snapshot":
    const snapshotVersion = process.argv[3];
    if (!snapshotVersion) {
      console.error("ERROR: mesh:set-snapshot requires a version argument");
      process.exit(1);
    }
    setSnapshot(snapshotVersion);
    break;
  case "sync:status":
    getSyncStatus();
    break;
  default:
    console.log(`
Frasberg Governance CLI

Usage: frasberg-governance <command>

Commands:
  mesh:status              Print current mesh metadata
  mesh:bump-version <v>   Bump meshVersion to <v>
  mesh:bump-raft          Increment raftTerm
  mesh:set-snapshot <v>   Set snapshotVersion to <v>
  sync:status             Show cross-repo sync status
    `);
    break;
}
