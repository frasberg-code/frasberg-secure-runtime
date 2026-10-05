import { deviationEngine } from "./deviation_engine/src/deviation_engine";
import { identityFilter } from "./identity_filter/src/identity_filter";
import { membraneEngine } from "./membrane_engine/src/membrane_engine";
import { tonalEngine } from "./tonal_engine/src/tonal_engine";

export const sofiaCoreIndex = {
  deviation_engine: deviationEngine,
  identity_filter: identityFilter,
  membrane_engine: membraneEngine,
  tonal_engine: tonalEngine
};
