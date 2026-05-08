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
  createdAt: string;
}

export interface WatchfaceListResponse {
  items: WatchfaceListItem[];
  total: number;
  page: number;
  limit: number;
}
