'use client';

import { useEffect } from 'react';

export default function WatchfacesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Watchfaces fetch error:', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-gray-800">Unable to load watch faces</p>
        <p className="mt-1 text-sm text-gray-500">
          Something went wrong. Please check your connection and try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
