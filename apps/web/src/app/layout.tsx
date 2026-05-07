import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'weWatch',
  description: 'Global third-party watch face platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
