Spec: https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md

Originally ported to TypeScript from: https://github.com/simonepri/phc-format

## Usage

This package provides a tiny serializer/deserializer for PHC strings that works in modern Node.js and Deno. It ships ESM and CJS builds and avoids Node-only APIs.

Exports:

-   serialize(opts): string
-   deserialize(phcString): { id, version?, params?, salt?, hash? }

Binary fields and cross-runtime behavior:

-   The `salt` and `hash` fields are returned as Uint8Array-compatible instances.
-   In Node.js, they will be Buffer instances for compatibility. In Deno and browsers, they are plain Uint8Array.
-   When serializing, pass `Uint8Array` (or `Buffer` on Node) and the library will base64-encode appropriately without padding.

### Node.js

ESM:

import { serialize, deserialize } from '@istvan.xyz/phc-format';

CommonJS:

const { serialize, deserialize } = require('@istvan.xyz/phc-format');

### Deno

Import via npm specifier:

import { serialize, deserialize } from 'npm:@istvan.xyz/phc-format';

### Examples

// Serialize
const out = serialize({
id: 'argon2i',
params: { m: 120, t: 5000, p: 2 },
salt: new Uint8Array([1,2,3]),
});

// Deserialize
const obj = deserialize('$argon2i$m=120,t=5000,p=2');
// obj.salt / obj.hash are Buffer (Node) or Uint8Array (Deno)

### Notes

-   The library targets Node >= 18.17. Deno is supported via the ESM build and generic APIs (no Node Buffer import required at compile-time).
-   Base64 encoding/decoding omits trailing '=' padding to match PHC examples; decoding accepts unpadded input.
