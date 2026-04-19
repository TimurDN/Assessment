import { z } from 'zod';

/**
 * Canonical error envelope returned by the booking-flow API.
 * Every 4xx/5xx response from `/api/*` conforms to this shape.
 */
export const ApiErrorSchema = z.object({
    error: z.string().min(1),
    message: z.string().min(1),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Booking-ID contract: `BK-` followed by exactly 5 digits. */
export const BookingIdSchema = z.string().regex(/^BK-\d{5}$/);
export type BookingId = z.infer<typeof BookingIdSchema>;
