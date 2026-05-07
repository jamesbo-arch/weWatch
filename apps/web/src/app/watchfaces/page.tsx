import { WatchfaceGrid } from '@/components/watchfaces/WatchfaceGrid';
import type { WatchfaceListResponse } from '@/types/watchface';

const API_INTERNAL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:3001/api/v1';

async function getWatchfaces(page = 1): Promise<WatchfaceListResponse> {
  const res = await fetch(`${API_INTERNAL}/watchfaces?page=${page}&limit=20`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<WatchfaceListResponse>;
}

export default async function WatchfacesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const data = await getWatchfaces(page);
  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Watch Faces</h1>
        <span className="text-sm text-gray-500">{data.total} faces</span>
      </div>

      <WatchfaceGrid items={data.items} />

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/watchfaces?page=${page - 1}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Previous
            </a>
          )}
          <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/watchfaces?page=${page + 1}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Next
            </a>
          )}
        </div>
      )}
    </main>
  );
}
