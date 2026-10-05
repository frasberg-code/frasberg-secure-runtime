export const classNames = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(" ");
