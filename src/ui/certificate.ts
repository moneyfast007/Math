/**
 * The certificate at the end of a world: a picture made on the device (never
 * sent anywhere) with the child's name, the world, the new friend and the
 * sticker, for the parents to keep or share themselves.
 *
 * Drawn from the art already on the screen: the SVGs are copied (their colours
 * made explicit, since a picture has no style sheet) into one SVG, which is
 * painted on a canvas and saved as a PNG.
 */

export interface CertificateText {
  title: string;
  name: string;
  world: string;
  line: string;
  date: string;
  site: string;
}

const W = 1080;
const H = 1350;

function esc(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

/** An SVG on the screen as standalone markup, placed at x, y in a box of `size`. */
function place(svg: SVGSVGElement | null, x: number, y: number, size: number): string {
  if (!svg) return '';
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('x', String(x));
  copy.setAttribute('y', String(y));
  copy.setAttribute('width', String(size));
  copy.setAttribute('height', String(size));
  copy.removeAttribute('class');
  copy.removeAttribute('style');
  copy.setAttribute('color', getComputedStyle(svg).color);
  return new XMLSerializer().serializeToString(copy);
}

export function certificateSvg(
  text: CertificateText,
  art: { plusi: SVGSVGElement | null; friend: SVGSVGElement | null; sticker: SVGSVGElement | null },
): string {
  const font = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Hebrew', Arial, sans-serif";
  const t = (y: number, size: number, weight: number, fill: string, value: string) =>
    `<text x="${W / 2}" y="${y}" text-anchor="middle" direction="rtl" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(value)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#FFF8EE"/>
<rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="48" fill="none" stroke="#2F8F83" stroke-width="10"/>
<rect x="66" y="66" width="${W - 132}" height="${H - 132}" rx="34" fill="none" stroke="#e8a33d" stroke-width="4" stroke-dasharray="14 12"/>
${t(200, 72, 800, '#2b2320', text.title)}
${place(art.sticker, W / 2 - 170, 250, 340)}
${t(700, 96, 800, '#1f6f65', text.name)}
${t(790, 46, 600, '#5a4a40', text.line)}
${t(860, 54, 800, '#2b2320', text.world)}
${art.friend ? place(art.plusi, W / 2 - 250, 920, 220) : place(art.plusi, W / 2 - 110, 920, 220)}
${place(art.friend, W / 2 + 40, 950, 190)}
${t(1225, 34, 500, '#7a6a60', text.date)}
${t(1270, 30, 700, '#2F8F83', text.site)}
</svg>`;
}

export async function certificatePng(svg: string): Promise<Blob | null> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, W, H);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The phone's share sheet with the picture where it can, else a download. */
export async function shareOrSave(png: Blob, fileName: string, title: string): Promise<void> {
  const file = new File([png], fileName, { type: 'image/png' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      // Closed without sharing: nothing more. Anything else: fall back to a download.
      if (e instanceof DOMException && e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(png);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
