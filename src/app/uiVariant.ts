/**
 * Which design of the entry screen and the parents' area to show: 'c' (the one
 * chosen after the persona review, and the default), or 'a' (the first one) and
 * 'b' while they are kept for comparison. Chosen with `?ui=a` in the address,
 * remembered on this device (browser storage, a convenience only); `?ui=c` goes
 * back. Every child-facing behaviour stays the same.
 */
export type UiVariant = 'a' | 'b' | 'c';

const KEY = 'ui-variant';

function isVariant(v: unknown): v is UiVariant {
  return v === 'a' || v === 'b' || v === 'c';
}

export function uiVariant(): UiVariant {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('ui');
    if (isVariant(fromUrl)) {
      localStorage.setItem(KEY, fromUrl);
      return fromUrl;
    }
    const kept = localStorage.getItem(KEY);
    return isVariant(kept) ? kept : 'c';
  } catch {
    return 'c';
  }
}
