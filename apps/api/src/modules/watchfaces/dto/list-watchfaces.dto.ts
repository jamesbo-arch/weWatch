import { z } from 'zod';

export const ListWatchfacesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListWatchfacesQuery = z.infer<typeof ListWatchfacesQuerySchema>;

export interface WatchfaceListItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  price: number;
  designerId: string;
  designerBrandName: string | null;
  deviceTargets: string[];
  downloadCount: number;
  createdAt: Date;
}

export interface ListWatchfacesResponse {
  items: WatchfaceListItem[];
  total: number;
  page: number;
  limit: number;
}
