import sharp from 'sharp';

/** Keep the generator and config gate on the exact same normalization path. */
export async function createNormalizedBrandMark(sourcePath: string): Promise<Buffer> {
  return sharp(sourcePath)
    .ensureAlpha()
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(448, 448, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 32, bottom: 32, left: 32, right: 32, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

export async function resizeBrandMark(mark: Buffer, size: number): Promise<Buffer> {
  return size === 512 ? mark : sharp(mark).resize(size, size, { fit: 'contain' }).png().toBuffer();
}

/** Compare decoded RGBA pixels so PNG metadata/compression does not matter. */
export async function hasSameImagePixels(left: Buffer | string, right: Buffer | string): Promise<boolean> {
  try {
    const [a, b] = await Promise.all([
      sharp(left).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
      sharp(right).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ]);
    return a.info.width === b.info.width
      && a.info.height === b.info.height
      && a.data.equals(b.data);
  } catch {
    return false;
  }
}
