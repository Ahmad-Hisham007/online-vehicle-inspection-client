import { readFileSync } from "fs";
import { join } from "path";

/**
 * Cache for font bytes to avoid repeated disk reads in hot functions.
 */
let cachedFontBytes: Uint8Array | null = null;

/**
 * Read the vendored font file from the filesystem.
 * Memoized at module scope for performance.
 */
export function readFont(): Uint8Array {
  if (cachedFontBytes) {
    return cachedFontBytes;
  }
  const fontPath = join(process.cwd(), "./app/lib/pdf/fonts/just-me-again-down-here.ttf");
  cachedFontBytes = readFileSync(fontPath);
  return cachedFontBytes;
}

/**
 * Read a PDF asset file from the pdf-assets directory.
 * Paths are relative to `app/lib/pdf-assets/`.
 */
export function readAsset(assetPath: string): Uint8Array {
  const fullPath = join(process.cwd(), `./app/lib/pdf-assets/${assetPath}`);
  return readFileSync(fullPath);
}