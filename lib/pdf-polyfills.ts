/**
 * Polyfills required to run pdf.js (pdfjs-dist) under React Native's Hermes
 * engine, which is missing several web globals that pdf.js relies on.
 *
 * Importing this module installs the missing globals as a side effect. It MUST
 * be imported before `pdfjs-dist`, which captures some of these at module load.
 * Every polyfill is guarded so it never clobbers a native implementation.
 */
import structuredClonePonyfill from '@ungap/structured-clone';
import 'fast-text-encoding';
import { ReadableStream } from 'web-streams-polyfill';

type Mutable = Record<string, unknown>;
const g = globalThis as unknown as Mutable;

// pdf.js's in-process ("fake") worker clones messages — including the PDF bytes —
// with structuredClone. The ponyfill handles ArrayBuffers and typed arrays; we
// drop the { transfer } option (it just copies instead of transferring).
if (typeof g.structuredClone !== 'function') {
    g.structuredClone = (value: unknown) => structuredClonePonyfill(value);
}

// Used throughout pdf.js for deferred work.
const P = Promise as unknown as { withResolvers?: unknown };
if (typeof P.withResolvers !== 'function') {
    P.withResolvers = function withResolvers<T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: unknown) => void;
        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

// pdf.js streams page/text data through ReadableStream.
if (typeof g.ReadableStream !== 'function') {
    g.ReadableStream = ReadableStream;
}

// Hermes has no DOMException. pdf.js bundles core-js's DOMException polyfill,
// which UNCONDITIONALLY reads `globalThis.DOMException.prototype` (and calls
// `new DOMException(...)`) at module-load time — so without this it crashes the
// pdf.js import with "Cannot read property 'prototype' of undefined". A minimal
// Error subclass satisfies core-js, which then adopts it as-is.
if (typeof g.DOMException !== 'function') {
    class DOMException extends Error {
        code: number;
        constructor(message?: string, name?: string) {
            super(message);
            this.name = name ?? 'Error';
            this.code = 0;
        }
    }
    g.DOMException = DOMException;
}

// Minimal base64 codecs — Hermes has no atob/btoa, and pdf.js touches them.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
if (typeof g.btoa !== 'function') {
    g.btoa = (input: string): string => {
        let out = '';
        for (let i = 0; i < input.length;) {
            const c1 = input.charCodeAt(i++);
            const c2 = input.charCodeAt(i++);
            const c3 = input.charCodeAt(i++);
            const e1 = c1 >> 2;
            const e2 = ((c1 & 3) << 4) | (c2 >> 4);
            let e3 = ((c2 & 15) << 2) | (c3 >> 6);
            let e4 = c3 & 63;
            if (isNaN(c2)) e3 = e4 = 64;
            else if (isNaN(c3)) e4 = 64;
            out += B64[e1] + B64[e2] + (e3 === 64 ? '=' : B64[e3]) + (e4 === 64 ? '=' : B64[e4]);
        }
        return out;
    };
}
if (typeof g.atob !== 'function') {
    g.atob = (input: string): string => {
        const str = input.replace(/=+$/, '');
        let out = '';
        for (let bc = 0, bs = 0, i = 0; i < str.length; i++) {
            const idx = B64.indexOf(str.charAt(i));
            if (idx === -1) continue;
            bs = bc % 4 ? bs * 64 + idx : idx;
            if (bc++ % 4) out += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
        }
        return out;
    };
}
