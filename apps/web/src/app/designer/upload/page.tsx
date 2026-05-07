'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { UploadForm } from '@/components/upload/UploadForm';

export default function DesignerUploadPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/auth?redirect=/designer/upload');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Watch Face</h1>
        <p className="mt-1 text-sm text-gray-500">Publish your design to the weWatch marketplace.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <UploadForm />
      </div>
    </main>
  );
}
