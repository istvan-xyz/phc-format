import { asRuntimeBytes, base64ToBytes } from './base64';
import { idRegex, nameRegex, valueRegex } from './patterns';

const b64Regex = /^([a-zA-Z0-9/+.-]+|)$/;
const decimalRegex = /^((-)?[1-9]\d*|0)$/;
const versionRegex = /^v=(\d+)$/;

const keyValueStringToObject = (string: string): { [key: string]: unknown } => {
    const object: { [key: string]: string } = {};

    string.split(',').forEach(ps => {
        const tokens = ps.split('=');
        if (tokens.length < 2) {
            throw new TypeError('params must be in the format name=value');
        }

        object[tokens.shift() as string] = tokens.join('=');
    });

    return object;
};

/**
 * Parses data from a PHC string.
 * @param  {string} phcString A PHC string to parse.
 * @return {Object} The object containing the data parsed from the PHC string.
 */
export default function deserialize(phcString: string) {
    if (phcString === '') {
        throw new TypeError('phcString must be a non-empty string');
    }

    if (phcString[0] !== '$') {
        throw new TypeError('phcString must contain a $ as first char');
    }

    const fields = phcString.split('$');

    // Remove first empty $
    fields.shift();

    // Parse Fields
    let maxFields = 5;

    if (!versionRegex.test(fields[1])) maxFields--;
    if (fields.length > maxFields) {
        throw new TypeError(`phcString contains too many fields: ${fields.length}/${maxFields}`);
    }

    // Parse Identifier
    const id = fields.shift();

    if (!id) {
        throw new Error('id cannot be undefined at this point.');
    }

    if (!idRegex.test(id)) {
        throw new TypeError(`id must satisfy ${idRegex}`);
    }

    let version;

    // Parse Version
    if (versionRegex.test(fields[0])) {
        const versionString = fields.shift();

        if (!versionString) {
            throw new Error('paramString cannot be undefined at this point.');
        }

        version = parseInt((versionString.match(versionRegex) as RegExpMatchArray)[1], 10);
    }

    let hash: Uint8Array | undefined;
    let salt: Uint8Array | undefined;
    if (b64Regex.test(fields[fields.length - 1])) {
        if (fields.length > 1 && b64Regex.test(fields[fields.length - 2])) {
            // Parse Hash
            hash = asRuntimeBytes(base64ToBytes(fields.pop() as string));
            // Parse Salt
            salt = asRuntimeBytes(base64ToBytes(fields.pop() as string));
        } else {
            // Parse Salt
            salt = asRuntimeBytes(base64ToBytes(fields.pop() as string));
        }
    }

    // Parse Parameters
    let params: { [key: string]: unknown } | undefined;

    if (fields.length > 0) {
        const paramString = fields.pop();

        if (!paramString) {
            throw new Error('paramString cannot be undefined at this point.');
        }

        const currentParams = keyValueStringToObject(paramString);

        if (!Object.keys(currentParams).every(p => nameRegex.test(p))) {
            throw new TypeError(`params names must satisfy ${nameRegex}`);
        }

        const pv = Object.values(currentParams);
        if (!pv.every(v => valueRegex.test(v as string))) {
            throw new TypeError(`params values must satisfy ${valueRegex}`);
        }

        const pk = Object.keys(currentParams);
        // Convert Decimal Strings into Numbers
        pk.forEach(k => {
            currentParams[k] = decimalRegex.test(currentParams[k] as string)
                ? parseInt(currentParams[k] as string, 10)
                : currentParams[k];
        });

        params = currentParams;
    }

    if (fields.length > 0) {
        throw new TypeError(`phcString contains unrecognized fields: ${fields}`);
    }

    // Build the output object
    const result: {
        id?: string;
        version?: number;
        params?: { [key: string]: unknown };
        salt?: Uint8Array;
        hash?: Uint8Array;
    } = { id };

    if (version) {
        result.version = version;
    }

    if (params) {
        result.params = params;
    }

    if (salt) {
        result.salt = salt;
    }

    if (hash) {
        result.hash = hash;
    }

    return result;
}
