import { z } from 'zod';

/** Plasterboard handling options accepted by the API. */
export const PlasterboardOptionSchema = z.enum([
    'bagged',
    'segregated',
    'collection',
]);
export type PlasterboardOption = z.infer<typeof PlasterboardOptionSchema>;

/** POST /api/waste-types request body. */
export const WasteTypesRequestSchema = z.object({
    heavyWaste: z.boolean(),
    plasterboard: z.boolean(),
    plasterboardOption: PlasterboardOptionSchema.nullable(),
});
export type WasteTypesRequest = z.infer<typeof WasteTypesRequestSchema>;

/** POST /api/waste-types 200 response. */
export const WasteTypesResponseSchema = z.object({ ok: z.literal(true) });
export type WasteTypesResponse = z.infer<typeof WasteTypesResponseSchema>;
