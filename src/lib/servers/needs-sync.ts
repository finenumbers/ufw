/** True when the server has no UFW snapshot yet and a signed-in user should trigger initial sync. */
export function serverNeedsInitialSync(hasUser: boolean, hasSnapshot: boolean): boolean {
  return hasUser && !hasSnapshot;
}
