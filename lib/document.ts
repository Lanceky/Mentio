import { File } from 'expo-file-system';

/**
 * Reading study material the learner uploads, so DeepSeek can build Mentio's
 * confused questions around the actual content.
 *
 * Supported on-device, no native modules (works in Expo Go):
 *  - Plain text (txt, md, csv, json, html, …) via direct read
 *  - PDF via pdf.js (lazy-loaded)
 *  - DOCX via JSZip (lazy-loaded)
 *
 * Scanned PDFs/photos have no text layer and can't be OCR'd client-side, so they
 * come back as 'empty'/'unsupported' and Mentio asks the learner to explain them.
 */

/** Cap how much document text we send so we stay within a sane token budget. */
const MAX_DOC_CHARS = 12000;

/** A document whose text we successfully pulled out. */
export type LoadedDocument = {
    name: string;
    text: string;
    /** True when the document was longer than the budget and got cut off. */
    truncated: boolean;
};

export type LoadDocumentResult =
    | { ok: true; doc: LoadedDocument }
    | { ok: false; reason: 'unsupported' | 'empty' | 'error' };

/** The bits of an expo-document-picker asset we care about. */
export type PickedAsset = {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
};

type DocKind = 'text' | 'pdf' | 'docx' | 'unsupported';

const TEXT_MIME_EXACT = new Set([
    'application/json',
    'application/xml',
    'application/javascript',
    'application/x-yaml',
    'application/rtf',
]);
const TEXT_EXTENSIONS = [
    '.txt', '.md', '.markdown', '.csv', '.tsv', '.json',
    '.xml', '.html', '.htm', '.rtf', '.log', '.tex', '.yml', '.yaml',
];

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Decide how to read a file from its mime type, falling back to its extension. */
function classify(asset: PickedAsset): DocKind {
    const mime = asset.mimeType?.toLowerCase() ?? '';
    const name = asset.name.toLowerCase();

    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    if (mime === DOCX_MIME || name.endsWith('.docx')) return 'docx';
    if (mime.startsWith('text/') || TEXT_MIME_EXACT.has(mime)) return 'text';
    if (TEXT_EXTENSIONS.some((ext) => name.endsWith(ext))) return 'text';
    return 'unsupported';
}

function finish(name: string, raw: string): LoadDocumentResult {
    const text = raw.trim();
    if (!text) return { ok: false, reason: 'empty' };
    const truncated = text.length > MAX_DOC_CHARS;
    return {
        ok: true,
        doc: { name, text: truncated ? text.slice(0, MAX_DOC_CHARS) : text, truncated },
    };
}

/**
 * Read an uploaded document's text. Returns the extracted (possibly truncated)
 * text, or a reason it couldn't be read so the caller can react in character.
 */
export async function loadDocumentText(asset: PickedAsset): Promise<LoadDocumentResult> {
    const kind = classify(asset);
    if (kind === 'unsupported') return { ok: false, reason: 'unsupported' };

    try {
        const file = new File(asset.uri);

        if (kind === 'text') {
            return finish(asset.name, await file.text());
        }

        const bytes = await file.bytes();

        if (kind === 'pdf') {
            const { extractPdfText } = await import('./extract-pdf');
            return finish(asset.name, await extractPdfText(bytes));
        }

        // docx
        const { extractDocxText } = await import('./extract-docx');
        return finish(asset.name, await extractDocxText(bytes));
    } catch {
        return { ok: false, reason: 'error' };
    }
}
