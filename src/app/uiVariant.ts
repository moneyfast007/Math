/**
 * Which design of the entry screen and the parents' area to show: 'a' (the
 * current one), 'b' or 'c'. Chosen with `?ui=b` in the address, remembered on
 * this device (browser storage, a convenience only); `?ui=a` goes back.
 * For comparing designs; every child-facing behaviour stays the same.
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
    return isVariant(kept) ? kept : 'a';
  } catch {
    return 'a';
  }
}
