import JSZip from 'jszip';

/**
 * Pure-JS DOCX text extraction.
 *
 * A .docx file is a ZIP archive; the body text lives in `word/document.xml` as
 * <w:t> runs grouped into <w:p> paragraphs. We unzip with JSZip, turn structural
 * tags into whitespace, strip the remaining XML, and decode entities. No native
 * modules — works in Expo Go.
 */

function decodeXmlEntities(input: string): string {
    return input
        .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}

/** Pull readable text out of a DOCX file's bytes. Returns '' if it has no body. */
export async function extractDocxText(data: Uint8Array): Promise<string> {
    const zip = await JSZip.loadAsync(data);
    const entry = zip.file('word/document.xml');
    if (!entry) return '';

    const xml = await entry.async('string');
    const withBreaks = xml
        .replace(/<w:tab\b[^>]*\/?>/g, '\t')
        .replace(/<w:br\b[^>]*\/?>/g, '\n')
        .replace(/<\/w:p>/g, '\n')
        .replace(/<\/w:tr>/g, '\n');

    const stripped = withBreaks.replace(/<[^>]+>/g, '');
    return decodeXmlEntities(stripped).replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
