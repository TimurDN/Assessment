import { z } from 'zod';

/** Canonical skip-size labels returned by the API. */
export const SkipSizeSchema = z.enum([
    '2-yard',
    '3-yard',
    '4-yard',
    '5-yard',
    '6-yard',
    '8-yard',
    '10-yard',
    '12-yard',
]);
export type SkipSize = z.infer<typeof SkipSizeSchema>;

/** Single skip entry in the catalogue. */
export const SkipSchema = z.object({
    size: SkipSizeSchema,
    price: z.number().int().positive(),
    disabled: z.boolean(),
    disabledReason: z.string().min(1).optional(),
});
export type Skip = z.infer<typeof SkipSchema>;

/** GET /api/skips 200 response. */
export const SkipsResponseSchema = z.object({
    skips: z.array(SkipSchema),
});
export type SkipsResponse = z.infer<typeof SkipsResponseSchema>;
