import { continuity, membrane, hinge, tonal } from "../../packages/shared";

export function enforceIdentity(engine, owner) {
  continuity(engine, owner);
  membrane(engine, owner);
  hinge(engine, owner);
  tonal(engine, owner);
}
