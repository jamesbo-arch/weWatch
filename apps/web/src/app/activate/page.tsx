'use client';

import { useState } from 'react';

interface ActivateResult {
  activated: boolean;
  licenseKey: string;
}

interface CheckResult {
  valid: boolean;
}

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

export default function ActivatePage() {
  const [deviceSerial, setDeviceSerial] = useState('');
  const [watchfaceId, setWatchfaceId] = useState('');
  const [activateResult, setActivateResult] = useState<ActivateResult | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setActivateResult(null);
    setCheckResult(null);
    try {
      const res = await fetch(`${API_BASE}/licenses/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceSerial, watchfaceId }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      setActivateResult((await res.json()) as ActivateResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCheckResult(null);
    try {
      const params = new URLSearchParams({ deviceSerial, watchfaceId });
      const res = await fetch(`${API_BASE}/licenses/check?${params.toString()}`);
      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      setCheckResult((await res.json()) as CheckResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">License Activation</h1>
      <p className="mb-8 text-sm text-gray-500">
        MVP demo — manually test the device serial → license key flow.
      </p>

      <div className="mb-6 rounded-lg border border-gray-200 p-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Device Serial
        </label>
        <input
          type="text"
          value={deviceSerial}
          onChange={(e) => setDeviceSerial(e.target.value)}
          placeholder="e.g. GARMIN-TEST-001"
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
        />
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Watch Face ID (UUID)
        </label>
        <input
          type="text"
          value={watchfaceId}
          onChange={(e) => setWatchfaceId(e.target.value)}
          placeholder="e.g. 11111111-1111-1111-1111-111111111111"
          className="mb-6 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
        />

        <div className="flex gap-3">
          <button
            onClick={handleActivate}
            disabled={loading || !deviceSerial || !watchfaceId}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Activate
          </button>
          <button
            onClick={handleCheck}
            disabled={loading || !deviceSerial || !watchfaceId}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Check
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {activateResult && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="mb-1 text-sm font-medium text-green-800">Activated successfully</p>
          <p className="text-xs text-gray-600">License Key:</p>
          <p className="break-all font-mono text-xs text-gray-900">{activateResult.licenseKey}</p>
        </div>
      )}

      {checkResult && (
        <div
          className={`rounded-md border px-4 py-3 ${
            checkResult.valid
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <p className={`text-sm font-medium ${checkResult.valid ? 'text-green-800' : 'text-red-700'}`}>
            License is {checkResult.valid ? 'VALID' : 'INVALID'}
          </p>
        </div>
      )}
    </main>
  );
}
