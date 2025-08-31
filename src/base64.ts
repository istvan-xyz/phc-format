// Lightweight base64 helpers that work in Node, Deno, and browsers without requiring Buffer types.
// Encoding omits padding (=) to match PHC formatting behavior used in this project.

function bytesToBinaryString(bytes: Uint8Array): string {
    let result = '';
    for (const b of bytes) {
        result += String.fromCharCode(b);
    }
    return result;
}

function binaryStringToBytes(binary: string): Uint8Array {
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        out[i] = binary.charCodeAt(i);
    }
    return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
    // Prefer global btoa when available (Deno, browsers)
    let b64: string;
    const g = globalThis as unknown as {
        btoa?: (data: string) => string;
        atob?: (data: string) => string;
        // Intentionally loose shape to avoid Node type dependency
        Buffer?: unknown;
    };
    if (typeof g.btoa === 'function') {
        b64 = g.btoa(bytesToBinaryString(bytes));
    } else if (typeof g.Buffer !== 'undefined') {
        // Node fallback
        // Use node's Buffer without importing types
        const BufferLike = g.Buffer as unknown as {
            from: (input: unknown) => { toString: (enc: string) => string };
        };
        const nodeBuf = BufferLike.from(bytes);
        b64 = nodeBuf.toString('base64');
    } else {
        // Very old environments; last resort using TextEncoder/Decoder
        // Note: This will not work without a polyfill for btoa/atob
        throw new Error('No base64 encoder available in this environment');
    }
    // Strip trailing padding as PHC examples avoid '=' chars
    return b64.replace(/=+$/u, '');
}

export function base64ToBytes(b64: string): Uint8Array {
    // Re-add padding to make length a multiple of 4
    const padLength = (4 - (b64.length % 4)) % 4;
    const padded = b64 + '='.repeat(padLength);

    const g = globalThis as unknown as {
        atob?: (data: string) => string;
        Buffer?: unknown;
    };
    if (typeof g.atob === 'function') {
        const binary = g.atob(padded);
        return binaryStringToBytes(binary);
    }
    if (typeof g.Buffer !== 'undefined') {
        const BufferLike = g.Buffer as unknown as {
            from: (input: unknown, enc: string) => Uint8Array;
        };
        const buf = BufferLike.from(padded, 'base64');
        return new Uint8Array(buf);
    }
    throw new Error('No base64 decoder available in this environment');
}

// In Node, prefer returning Buffer instances for compatibility with existing code/tests.
export function asRuntimeBytes(bytes: Uint8Array): Uint8Array {
    const g = globalThis as unknown as { Buffer?: unknown };
    if (typeof g.Buffer !== 'undefined') {
        const BufferLike = g.Buffer as unknown as {
            from: (input: unknown) => Uint8Array;
        };
        return BufferLike.from(bytes);
    }
    return bytes;
}
