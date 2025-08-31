// cspell:words phcobj, phcstr, Valto, strpar, pchstr, maxf, parstr
import { bytesToBase64 } from './base64';
import { idRegex, nameRegex, valueRegex } from './patterns';

function objectToKeyValueString(object: { [key: string]: unknown }) {
    return Object.entries(object)
        .map(([key, value]) => [key, value].join('='))
        .join(',');
}

/**
 * Generates a PHC string using the data provided.
 * @param  {Object} opts Object that holds the data needed to generate the PHC
 * string.
 * @param  {string} opts.id Symbolic name for the function.
 * @param  {Number} [opts.version] The version of the function.
 * @param  {Object} [opts.params] Parameters of the function.
 * @param  {Buffer} [opts.salt] The salt as a binary buffer.
 * @param  {Buffer} [opts.hash] The hash as a binary buffer.
 * @return {string} The hash string adhering to the PHC format.
 */
export default function serialize(opts: {
    id: string;
    version?: number;
    params?: { [key: string]: string | Uint8Array | number };
    salt?: Uint8Array;
    hash?: Uint8Array;
}) {
    const fields = [''];

    if (!idRegex.test(opts.id)) {
        throw new TypeError(`id must satisfy ${idRegex}`);
    }

    fields.push(opts.id);

    if (typeof opts.version !== 'undefined') {
        if (opts.version < 0 || !Number.isInteger(opts.version)) {
            throw new TypeError('version must be a positive integer number');
        }

        fields.push(`v=${opts.version}`);
    }

    // Parameter Validation
    const { params } = opts;
    if (typeof params !== 'undefined') {
        const safeParams: { [key: string]: string | Uint8Array | number } = { ...params };
        const pk = Object.keys(safeParams);
        if (!pk.every(p => nameRegex.test(p))) {
            throw new TypeError(`params names must satisfy ${nameRegex}`);
        }

        // Convert Numbers into Numeric Strings and Uint8Array into B64 encoded strings.
        pk.forEach(k => {
            if (typeof safeParams[k] === 'number') {
                safeParams[k] = String(safeParams[k] as number);
            } else if (safeParams[k] instanceof Uint8Array) {
                safeParams[k] = bytesToBase64(safeParams[k] as Uint8Array);
            }
        });
        const pv = Object.values(safeParams);
        if (!pv.every(v => typeof v === 'string')) {
            throw new TypeError('params values must be strings');
        }

        if (!pv.every(v => valueRegex.test(v as string))) {
            throw new TypeError(`params values must satisfy ${valueRegex}`);
        }

        const strpar = objectToKeyValueString(safeParams);
        fields.push(strpar);
    }

    if (typeof opts.salt !== 'undefined') {
        fields.push(bytesToBase64(opts.salt));

        if (typeof opts.hash !== 'undefined') {
            // Hash Validation
            if (!(opts.hash instanceof Uint8Array)) {
                throw new TypeError('hash must be a Uint8Array');
            }

            fields.push(bytesToBase64(opts.hash));
        }
    }

    // Create the PHC formatted string
    const phcString = fields.join('$');

    return phcString;
}
