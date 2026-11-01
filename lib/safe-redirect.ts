/** Returns `value` only if it is a same-origin relative path; otherwise "/". */
export function safeRedirectPath(value: string | string[] | undefined) {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}
