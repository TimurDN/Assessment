import { z } from 'zod';
import { PlasterboardOptionSchema } from './waste-types';
import { SkipSizeSchema } from './skips';
import { BookingIdSchema } from '../util/common';

/** POST /api/booking/confirm request body. */
export const BookingConfirmRequestSchema = z.object({
    postcode: z.string(),
    addressId: z.string().min(1),
    heavyWaste: z.boolean(),
    plasterboard: z.boolean(),
    plasterboardOption: PlasterboardOptionSchema.nullable(),
    skipSize: SkipSizeSchema,
    price: z.number().int().positive(),
});
export type BookingConfirmRequest = z.infer<typeof BookingConfirmRequestSchema>;

/** POST /api/booking/confirm 200 response. */
export const BookingConfirmResponseSchema = z.object({
    status: z.literal('success'),
    bookingId: BookingIdSchema,
    idempotent: z.boolean().optional(),
});
export type BookingConfirmResponse = z.infer<typeof BookingConfirmResponseSchema>;
