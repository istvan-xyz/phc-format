import { test, expect } from 'vitest';
import { serialize } from '../src';
import {
    serialized,
    deserialized,
    bufferExample,
    bufferExampleString,
} from './fixtures';

test('should serialize correct phc objects', () => {
    deserialized.forEach((_, i) => {
        expect(serialize(deserialized[i])).toEqual(serialized[i]);
    });

    expect(serialize(bufferExample)).toEqual(bufferExampleString);
});

test('should throw errors if trying to serialize with invalid arguments', () => {
    expect(() => {
        serialize({ id: 'i_n_v_a_l_i_d' });
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        serialize({ id: 'pbkdf2', params: { rounds_: '1000' } });
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        serialize({ id: 'pbkdf2', params: { rounds: '1000@' } });
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        serialize({ id: 'argon2id', version: -10 });
    }).toThrowErrorMatchingSnapshot();
});
