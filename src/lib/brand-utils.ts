export interface BrandHsl {
  h: number;
  s: number;
  l: number;
}

export function parseBrandHsl(css: string): BrandHsl | null {
  const match = css.match(/--brand:\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  return match ? { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) } : null;
}

export function hslToHex(h: number, s: number, l: number): string {
  const saturation = s / 100;
  const lightness = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const value = lightness - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(value * 255).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

const CJK_RE = /[\u{3040}-\u{30ff}\u{31f0}-\u{31ff}\u{3400}-\u{4dbf}\u{4e00}-\u{9fff}\u{f900}-\u{faff}]/u;

export function hasCjk(text: string): boolean {
  return CJK_RE.test(text);
}

export function stripEmoji(text: string): string {
  return text.replace(/[\p{Extended_Pictographic}\u{FE0F}]/gu, '').trim();
}

export function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function subsetText(...parts: string[]): string {
  return [...new Set(parts.join(''))].sort().join('');
}
