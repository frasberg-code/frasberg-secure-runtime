import { getAppEntry } from './frasberg_application_shell/app_shell_runtime';

export function bootstrapFrasberg(initialContext: object = {}) {
  const entry = getAppEntry();
  return entry.initializeFrasbergAppShell(initialContext);
}

export const bootstrapFrasbergCore = bootstrapFrasberg;
