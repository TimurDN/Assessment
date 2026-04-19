import { faker } from '@faker-js/faker';

/**
 * Reusable invalid-value sets for API field validation testing.
 *
 * - `invalid*` sets include null/undefined/""/wrong types — for required fields
 * - `invalid*Types` sets include wrong types only — for optional fields where
 *   null/undefined/"" may be valid
 * - `boundary*` sets include edge-case values within the correct type
 */

export const invalidString = [
    '',
    '   ',
    null,
    undefined,
    faker.number.int(),
    faker.number.float({ min: 1, max: 2, fractionDigits: 2 }),
    true,
    false,
    [],
    {},
];

export const invalidBoolean = [
    '',
    '   ',
    null,
    undefined,
    faker.string.alpha(5),
    faker.number.int(),
    faker.number.float({ min: 1, max: 2, fractionDigits: 2 }),
    [],
    {},
];

export const invalidInteger = [
    '',
    '   ',
    null,
    undefined,
    faker.string.alpha(5),
    faker.datatype.boolean(),
    faker.number.int({ min: -1000, max: -1 }),
    faker.number.float({ min: 1, max: 2, fractionDigits: 2 }),
    faker.number.float({ min: 0.001, max: 0.01, fractionDigits: 3 }),
    [],
    {},
];

export const invalidObject = [
    '',
    '   ',
    null,
    undefined,
    faker.string.alpha(5),
    faker.number.int(),
    faker.number.float({ min: 1, max: 2, fractionDigits: 2 }),
    faker.datatype.boolean(),
    [],
];

export const invalidStringTypes = [
    faker.number.int(),
    faker.number.float({ min: 1, max: 2, fractionDigits: 2 }),
    true,
    false,
    [],
    {},
];

export const invalidBooleanTypes = [
    faker.string.alpha(5),
    faker.helpers.multiple(() => faker.string.symbol(), { count: 5 }).join(''),
    faker.number.int(),
    faker.number.float({ min: 1, max: 2, fractionDigits: 2 }),
    [],
    {},
];

export const invalidIntegerTypes = [
    faker.string.alpha(5),
    faker.helpers.multiple(() => faker.string.symbol(), { count: 5 }).join(''),
    faker.datatype.boolean(),
    faker.number.float({ min: 1, max: 2, fractionDigits: 2 }),
    faker.number.float({ min: 0.001, max: 0.01, fractionDigits: 3 }),
    faker.number.int({ min: -1000, max: -1 }),
    [],
    {},
];

export const invalidIntegerStrictTypes: unknown[] = [
    'abc',
    null,
    true,
    false,
    [],
    {},
];

export const invalidObjectTypes = [
    faker.string.alpha(5),
    faker.helpers.multiple(() => faker.string.symbol(), { count: 5 }).join(''),
    faker.number.int(),
    faker.number.float({ min: 1, max: 2, fractionDigits: 2 }),
    faker.datatype.boolean(),
    [],
];

export const specialChars = [
    faker.helpers.multiple(() => faker.string.symbol(), { count: 5 }).join(''),
    '<script>alert(1)</script>',
    '---',
    faker.helpers.multiple(() => faker.string.symbol(), { count: 10 }).join(''),
];

export const boundaryString = [
    faker.string.alpha({ length: 1 }),
    faker.string.alpha({ length: faker.number.int({ min: 255, max: 260 }) }),
    `${faker.word.noun()} ${faker.word.noun()}`,
    `${faker.string.alphanumeric(5)}-${faker.helpers.multiple(() => faker.string.symbol(), { count: 4 }).join('')}`,
    faker.string
        .alpha({ length: faker.number.int({ min: 8, max: 12 }) })
        .toUpperCase(),
    `${faker.string.alpha(5)}-${faker.helpers.arrayElement(['тест', '名前', '日本語', 'кириллица'])}`,
];

/**
 * Booking-domain specifics — kept alongside the generic matrices so
 * endpoint specs can pull everything from one import.
 */

/** UK postcodes that fail the documented regex but are non-empty strings. */
export const malformedPostcodes: ReadonlyArray<string> = [
    'NOTAPOSTCODE',
    'SW1A',
    '123 456',
    'ZZZ',
    'SW1A 1AAA',
    '!!!',
];

/** HTTP methods that are not declared on any booking endpoint. */
export const unsupportedMethods = ['PUT', 'PATCH', 'DELETE'] as const;
