import { z } from 'zod';

/** POST /api/postcode/lookup request body. */
export const PostcodeLookupRequestSchema = z.object({
    postcode: z.string(),
});
export type PostcodeLookupRequest = z.infer<typeof PostcodeLookupRequestSchema>;

/** Single address returned by the lookup endpoint. */
export const AddressSchema = z.object({
    id: z.string().min(1),
    line1: z.string().min(1),
    city: z.string().min(1),
});
export type Address = z.infer<typeof AddressSchema>;

/** POST /api/postcode/lookup 200 response. */
export const PostcodeLookupResponseSchema = z.object({
    postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/),
    addresses: z.array(AddressSchema),
});
export type PostcodeLookupResponse = z.infer<typeof PostcodeLookupResponseSchema>;
