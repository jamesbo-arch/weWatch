import type { WatchfaceListItem } from '@/types/watchface';
import { WatchfaceCard } from './WatchfaceCard';

export function WatchfaceGrid({ items }: { items: WatchfaceListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-lg font-medium">No watchfaces yet</p>
        <p className="mt-1 text-sm">Be the first to upload one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <WatchfaceCard key={item.id} item={item} />
      ))}
    </div>
  );
}
