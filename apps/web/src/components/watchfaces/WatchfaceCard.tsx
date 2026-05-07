import Image from 'next/image';
import Link from 'next/link';
import type { WatchfaceListItem } from '@/types/watchface';

function PriceBadge({ price }: { price: number }) {
  return (
    <span className="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
      {price === 0 ? 'Free' : `$${(price / 100).toFixed(2)}`}
    </span>
  );
}

export function WatchfaceCard({ item }: { item: WatchfaceListItem }) {
  return (
    <Link
      href={`/watchfaces/${item.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={item.thumbnailUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition group-hover:scale-105"
        />
        <PriceBadge price={item.price} />
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="truncate text-sm font-semibold text-gray-900">{item.title}</h3>
        {item.designerBrandName && (
          <p className="truncate text-xs text-gray-500">{item.designerBrandName}</p>
        )}
        <p className="text-xs text-gray-400">{item.downloadCount.toLocaleString()} downloads</p>
      </div>
    </Link>
  );
}
