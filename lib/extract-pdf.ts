// Hermes polyfills must load before pdfjs-dist captures globals.
import './pdf-polyfills';

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';
// The worker module (UMD) exports WorkerMessageHandler — the actual PDF parser.
// Registering it on the global lets pdf.js run that parser on the MAIN thread,
// since React Native has no Web Worker.
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker';

/**
 * Pure-JS PDF text extraction for React Native / Expo Go.
 *
 * We pin pdfjs-dist to v3's legacy build on purpose: v4's worker embeds a
 * multi-megabyte WASM blob as a string literal that Metro's parser rejects
 * ("Unterminated string constant"). v3's worker is plain JS that bundles fine,
 * and the text-extraction API (getDocument / getTextContent) is identical.
 *
 * pdf.js normally offloads work to a Web Worker; we force its in-process "fake
 * worker" by registering the handler on the global below. workerSrc is set to a
 * dummy so the "no workerSrc specified" guard never trips — it is never fetched
 * because the main-thread handler is already present.
 */
(globalThis as unknown as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;
pdfjs.GlobalWorkerOptions.workerSrc = 'mentio-pdf-worker';

/** Pull readable text out of a PDF's bytes. Returns '' if it has no text layer. */
export async function extractPdfText(data: Uint8Array): Promise<string> {
    const task = pdfjs.getDocument({
        data,
        // Keep it lean and Hermes-safe: no eval, no font rendering, no network.
        isEvalSupported: false,
        useSystemFonts: false,
        disableFontFace: true,
        useWorkerFetch: false,
    });

    const pdf = await task.promise;
    try {
        const pages: string[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
            const page = await pdf.getPage(n);
            const content = await page.getTextContent();
            const line = content.items
                .map((item) =>
                    typeof (item as { str?: unknown }).str === 'string' ? (item as { str: string }).str : ''
                )
                .join(' ');
            pages.push(line);
            page.cleanup();
        }
        return pages.join('\n\n').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    } finally {
        await task.destroy();
    }
}
