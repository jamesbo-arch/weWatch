import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Sign in — weWatch' };

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">weWatch</h1>
        <Suspense fallback={<div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
