declare module '@ungap/structured-clone' {
    /** Pure-JS structuredClone ponyfill. Deep-clones values incl. typed arrays. */
    export default function structuredClone<T = unknown>(
        value: T,
        options?: { json?: boolean; lossy?: boolean }
    ): T;
}

declare module 'pdfjs-dist/legacy/build/pdf.worker' {
    /** UMD worker bundle — imported only to register globalThis.pdfjsWorker. */
    const content: unknown;
    export = content;
}

// The worker is imported purely for its side effect of exposing the PDF parser;
// we only ever assign the namespace to globalThis, so `any` is sufficient.
declare module 'pdfjs-dist/legacy/build/pdf.worker.js';
