import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'SwapStay — Peer-to-Peer Home Exchange in India',
  description: 'Exchange access to verified homes across Mumbai, Bengaluru, Delhi NCR, and Hyderabad with explainable SwapScore and credit wallet.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
              <p>© 2026 SwapStay Four-City India MVP (Mumbai, Bengaluru, Delhi NCR, Hyderabad).</p>
              <p>Direct Swaps &bull; 1 Credit / Night Stay Hypothesis &bull; Deterministic SwapScore Engine</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
