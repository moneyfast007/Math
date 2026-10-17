/**
 * True when the app was launched from the home screen (iOS) or installed (others).
 * Used to hide install instructions and, later, to reassure parents about storage.
 */
export function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return window.matchMedia?.('(display-mode: standalone)').matches ?? false;
}
