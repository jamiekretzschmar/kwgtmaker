import archiver from 'archiver';
import { Writable } from 'stream';

/**
 * Generates a .kwgt compatible ZIP buffer with zero compression.
 * 
 * Architectural Reasoning:
 * Android's \`java.util.zip.ZipInputStream\` requires sequential reading of the ZIP directory.
 * Standard DEFLATE compression strips or alters local file headers, causing the Kustom engine
 * to fail with "None of these files have been found in ZIP stream".
 * By forcing \`store: true\` (compression level 0), we preserve the exact byte size and header
 * integrity of \`preset.json\`, allowing the Android parser to ingest it flawlessly.
 * 
 * @param {Object} jsonPayload - The raw JS object representing the KWGT preset.
 * @returns {Promise<Buffer>} - The raw uncompressed ZIP buffer.
 */
export async function generateKWGTBuffer(payload: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Initialize archiver with STORE method to bypass all compression
    const archive = archiver('zip', {
      zlib: { level: 0 }, // Force compression level to 0
      store: true         // Force ZIP to use STORE method
    });

    const chunks: Buffer[] = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      }
    });

    writable.on('finish', () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(writable);

    // 1. Append preset.json at the absolute root
    const jsonString = JSON.stringify(payload.presetJson || payload, null, 2);
    archive.append(jsonString, { name: 'preset.json' });

    // 2. Add instructions if provided
    if (payload.instructions) {
      archive.append(payload.instructions, { name: 'instructions.txt' });
    }

    // 3. Add preview image if provided
    if (payload.preview) {
      archive.append(Buffer.from(payload.preview, 'base64'), { name: 'preview.png' });
    }

    // 4. Add fonts
    if (payload.fonts && Array.isArray(payload.fonts) && payload.fonts.length > 0) {
      payload.fonts.forEach((font: any) => {
        archive.append(Buffer.from(font.data, 'base64'), { name: `fonts/${font.name}` });
      });
    } else {
      archive.append('', { name: 'fonts/.gitkeep' });
    }

    // 5. Add icons
    if (payload.icons && Array.isArray(payload.icons) && payload.icons.length > 0) {
      payload.icons.forEach((icon: any) => {
        archive.append(Buffer.from(icon.data, 'base64'), { name: `icons/${icon.name}` });
      });
    } else {
      archive.append('', { name: 'icons/.gitkeep' });
    }

    // 6. Add bitmaps
    if (payload.bitmaps && Array.isArray(payload.bitmaps) && payload.bitmaps.length > 0) {
      payload.bitmaps.forEach((bitmap: any) => {
        archive.append(Buffer.from(bitmap.data, 'base64'), { name: `bitmaps/${bitmap.name}` });
      });
    } else {
      archive.append('', { name: 'bitmaps/.gitkeep' });
    }

    // Finalize the archive stream
    archive.finalize();
  });
}
