import { z } from 'zod';

export const DEVICE_TARGETS = [
  'vivoactive4',
  'vivoactive4s',
  'fenix6',
  'fenix6s',
  'fenix6x',
  'fenix7',
  'fenix7s',
  'fenix7x',
  'forerunner245',
  'forerunner745',
  'forerunner945',
] as const;

export const UploadWatchfaceSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().int().min(0).default(0),
  deviceTargets: z
    .union([
      z.array(z.string()),
      z.string().transform((s) => {
        try {
          const parsed: unknown = JSON.parse(s);
          return Array.isArray(parsed) ? parsed : [s];
        } catch {
          return s.split(',').map((t) => t.trim()).filter(Boolean);
        }
      }),
    ])
    .pipe(z.array(z.string()))
    .default([]),
});

export type UploadWatchfaceDto = z.infer<typeof UploadWatchfaceSchema>;
