/**
 * Shared invalid-value matrices used across API specs.
 *
 * Inspired by the primelabs-automation convention: instead of writing one
 * test per bad value, each endpoint loops over these arrays inside a single
 * test case with a descriptive name, keeping the suite both thorough and
 * readable.
 */

/** Values that are not valid booleans but might sneak through a client. */
export const invalidBooleanValues: ReadonlyArray<unknown> = [
    null,
    undefined,
    0,
    1,
    'true',
    'false',
    'yes',
    '',
    [],
    {},
];

/** Values that are not valid non-empty strings. */
export const invalidStringValues: ReadonlyArray<unknown> = [
    null,
    undefined,
    42,
    true,
    false,
    [],
    {},
];

/** Bodies that should be rejected by endpoints expecting an object. */
export const malformedJsonStrings: ReadonlyArray<string> = [
    '',
    'not json',
    '{',
    '{"postcode":',
    '[1,2,',
];

/** Postcodes that fail the UK format regex but are non-empty strings. */
export const malformedPostcodes: ReadonlyArray<string> = [
    'NOTAPOSTCODE',
    'SW1A',
    '123 456',
    'ZZZ',
    'SW1A 1AAA',
    '!!!',
];

/** HTTP methods that are not declared for any booking endpoint. */
export const unsupportedMethods = ['PUT', 'PATCH', 'DELETE'] as const;
