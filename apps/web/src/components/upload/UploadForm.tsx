'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UploadSuccessCard } from './UploadSuccessCard';

const DEVICE_OPTIONS = [
  { value: 'fenix7', label: 'Fenix 7' },
  { value: 'fenix6', label: 'Fenix 6' },
  { value: 'venu2', label: 'Venu 2' },
  { value: 'forerunner955', label: 'Forerunner 955' },
  { value: 'vivoactive4', label: 'Vivoactive 4' },
];

const MAX_PRG_BYTES = 10 * 1024 * 1024;
const MAX_THUMB_BYTES = 2 * 1024 * 1024;

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().int().min(0, 'Price must be 0 or more'),
  deviceTargets: z.array(z.string()).optional(),
});

type UploadValues = z.infer<typeof uploadSchema>;

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full rounded-full bg-blue-600 transition-all duration-150"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function UploadForm() {
  const [prgFile, setPrgFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [prgError, setPrgError] = useState('');
  const [thumbError, setThumbError] = useState('');
  const [serverError, setServerError] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const prgRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadValues>({ resolver: zodResolver(uploadSchema), defaultValues: { price: 0 } });

  const handlePrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPrgError('');
    if (file && file.size > MAX_PRG_BYTES) {
      setPrgError('PRG file must be 10 MB or less');
      setPrgFile(null);
      e.target.value = '';
      return;
    }
    setPrgFile(file);
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setThumbError('');
    if (file && file.size > MAX_THUMB_BYTES) {
      setThumbError('Thumbnail must be 2 MB or less');
      setThumbFile(null);
      e.target.value = '';
      return;
    }
    setThumbFile(file);
  };

  const onSubmit = async (values: UploadValues) => {
    if (!prgFile) { setPrgError('PRG file is required'); return; }
    if (!thumbFile) { setThumbError('Thumbnail is required'); return; }

    setServerError('');
    setProgress(0);
    setUploading(true);

    const formData = new FormData();
    formData.append('prg', prgFile);
    formData.append('thumbnail', thumbFile);
    formData.append('title', values.title);
    if (values.description) formData.append('description', values.description);
    formData.append('price', String(values.price ?? 0));
    for (const t of values.deviceTargets ?? []) {
      formData.append('deviceTargets', t);
    }

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/watchfaces`);
      // SEC-02: send httpOnly cookie automatically (no manual Authorization header needed)
      xhr.withCredentials = true;
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          resolve();
        } else {
          let msg = 'Upload failed';
          try {
            const body = JSON.parse(xhr.responseText) as { message?: string };
            if (body.message) msg = body.message;
          } catch { /* ignore */ }
          reject(new Error(msg));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.send(formData);
    }).then(() => {
      setSuccessTitle(values.title);
    }).catch((e: unknown) => {
      setServerError(e instanceof Error ? e.message : 'Something went wrong');
    }).finally(() => {
      setUploading(false);
    });
  };

  const handleUploadAnother = () => {
    setSuccessTitle('');
    setServerError('');
    setProgress(0);
    setPrgFile(null);
    setThumbFile(null);
    reset();
    if (prgRef.current) prgRef.current.value = '';
    if (thumbRef.current) thumbRef.current.value = '';
  };

  if (successTitle) {
    return <UploadSuccessCard title={successTitle} onUploadAnother={handleUploadAnother} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title *</label>
        <input
          {...register('title')}
          type="text"
          placeholder="e.g. Minimal Dark Face"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Describe your watch face…"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">PRG File * (.prg, max 10 MB)</label>
        <input
          ref={prgRef}
          type="file"
          accept=".prg"
          onChange={handlePrgChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
        {prgError && <p className="mt-1 text-xs text-red-500">{prgError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Thumbnail * (JPEG or PNG, max 2 MB)</label>
        <input
          ref={thumbRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleThumbChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
        {thumbError && <p className="mt-1 text-xs text-red-500">{thumbError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Target Devices</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DEVICE_OPTIONS.map((d) => (
            <label key={d.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                value={d.value}
                {...register('deviceTargets')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Price (cents, 0 = free)</label>
        <input
          {...register('price')}
          type="number"
          min={0}
          step={1}
          className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <FieldError message={errors.price?.message} />
      </div>

      {uploading && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Uploading… {progress}%</p>
          <ProgressBar value={progress} />
        </div>
      )}

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Upload watch face'}
      </button>
    </form>
  );
}
