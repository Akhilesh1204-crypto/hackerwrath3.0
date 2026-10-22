import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SwapStay API & Platform',
  description: 'Peer-to-peer home exchange platform for Mumbai, Bengaluru, Delhi NCR, and Hyderabad',
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
