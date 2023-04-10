// cspell:words phcobj, phcstr, Valto, strpar, pchstr, maxf, parstr
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
    params?: { [key: string]: string | Buffer | number };
    salt?: Buffer;
    hash?: Buffer;
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
        const pk = Object.keys(params);
        if (!pk.every(p => nameRegex.test(p))) {
            throw new TypeError(`params names must satisfy ${nameRegex}`);
        }

        // Convert Numbers into Numeric Strings and Buffers into B64 encoded strings.
        pk.forEach(k => {
            if (typeof params[k] === 'number') {
                params[k] = (params[k] as string).toString();
            } else if (Buffer.isBuffer(params[k])) {
                [params[k]] = (params[k] as Buffer).toString('base64').split('=');
            }
        });
        const pv = Object.values(params);
        if (!pv.every(v => typeof v === 'string')) {
            throw new TypeError('params values must be strings');
        }

        if (!pv.every(v => valueRegex.test(v as string))) {
            throw new TypeError(`params values must satisfy ${valueRegex}`);
        }

        const strpar = objectToKeyValueString(params);
        fields.push(strpar);
    }

    if (typeof opts.salt !== 'undefined') {
        fields.push(opts.salt.toString('base64').split('=')[0]);

        if (typeof opts.hash !== 'undefined') {
            // Hash Validation
            if (!Buffer.isBuffer(opts.hash)) {
                throw new TypeError('hash must be a Buffer');
            }

            fields.push(opts.hash.toString('base64').split('=')[0]);
        }
    }

    // Create the PHC formatted string
    const phcString = fields.join('$');

    return phcString;
}
