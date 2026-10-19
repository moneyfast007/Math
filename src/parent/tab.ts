/**
 * The parent area's sections. Another screen can ask for the section the
 * parent area opens on (the welcome's "connect or restore" opens the settings).
 * Lives only in memory, and is used once.
 */
export type ParentTab = 'children' | 'progress' | 'settings';

export const PARENT_TABS: readonly ParentTab[] = ['children', 'progress', 'settings'];

let requested: ParentTab | null = null;

export function requestParentTab(tab: ParentTab): void {
  requested = tab;
}

export function takeParentTab(): ParentTab | null {
  const tab = requested;
  requested = null;
  return tab;
}
