import { WatchfaceGridSkeleton } from '@/components/watchfaces/WatchfaceGridSkeleton';

export default function WatchfacesLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-7 w-36 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
      </div>
      <WatchfaceGridSkeleton count={12} />
    </main>
  );
}
