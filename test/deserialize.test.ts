import { expect, test } from 'vitest';
import { deserialize } from '../src';
import { deserialized, serialized } from './fixtures';

test('should deserialize correct phc strings', () => {
    serialized.forEach((_, i) => {
        expect(deserialize(serialized[i])).toEqual(deserialized[i]);
    });
});

// cspell:disable
test('should thow errors if trying to deserialize an invalid phc string', () => {
    expect(() => {
        deserialize('');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        deserialize('a$invalid');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        deserialize('$b$c$d$e$f');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        deserialize('invalid');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        deserialize('$i_n_v_a_l_i_d');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        deserialize('$pbkdf2$rounds_=1000');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        deserialize('$pbkdf2$rounds=1000@');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        deserialize('$pbkdf2$rounds:1000');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        deserialize('$argon2i$unrecognized$m=120,t=5000,p=2$EkCWX6pSTqWruiR0');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        deserialize('$argon2i$unrecognized$v=19$m=120,t=5000,p=2$EkCWX6pSTqWruiR0');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
        deserialize('$argon2i$v=19$unrecognized$m=120,t=5000,p=2$EkCWX6pSTqWruiR0');
    }).toThrowErrorMatchingSnapshot();
});
// cspell:enable
