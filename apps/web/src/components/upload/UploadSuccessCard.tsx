'use client';

import Link from 'next/link';

interface UploadSuccessCardProps {
  title: string;
  onUploadAnother: () => void;
}

export function UploadSuccessCard({ title, onUploadAnother }: UploadSuccessCardProps) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-900">Upload successful!</h2>
      <p className="mt-1 text-sm text-gray-600">
        <span className="font-medium">{title}</span> has been published to the marketplace.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={onUploadAnother}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Upload another
        </button>
        <Link
          href="/watchfaces"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          View watch faces
        </Link>
      </div>
    </div>
  );
}
