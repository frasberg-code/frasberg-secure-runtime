import { getAppEntry } from './sofia_core_application_shell/app_shell_runtime';

export function bootstrapSofiaCore(initialContext: object = {}) {
  const entry = getAppEntry();
  return entry.initializeSofiaAppShell(initialContext);
}
