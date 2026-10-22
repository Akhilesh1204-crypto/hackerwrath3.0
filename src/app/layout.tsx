import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SwapStay Backend API & Platform',
  description: 'Authoritative backend for SwapStay Four-City India MVP (Mumbai, Bengaluru, Delhi NCR, Hyderabad)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
