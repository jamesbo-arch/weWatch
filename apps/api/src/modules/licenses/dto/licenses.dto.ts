import { z } from 'zod';

export const ActivateSchema = z.object({
  deviceSerial: z.string().min(1).max(64),
  watchfaceId: z.string().uuid(),
});

export const CheckQuerySchema = z.object({
  deviceSerial: z.string().min(1).max(64),
  watchfaceId: z.string().uuid(),
});

export type ActivateDto = z.infer<typeof ActivateSchema>;
