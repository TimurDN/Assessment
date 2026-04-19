import { z } from 'zod';

/** POST /api/testkit/reset 200 response. */
export const TestResetResponseSchema = z.object({
    ok: z.literal(true),
    reset: z.object({
        retryCounter: z.string().min(1),
        bookings: z.enum(['scoped', 'all']),
    }),
});
export type TestResetResponse = z.infer<typeof TestResetResponseSchema>;
