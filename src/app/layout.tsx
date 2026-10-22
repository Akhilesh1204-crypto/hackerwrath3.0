import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { AppChrome } from '@/components/layout/AppChrome';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'SwapStay — Travel by swapping homes',
    template: '%s · SwapStay',
  },
  description:
    'SwapStay is a trusted home-exchange network across Mumbai, Bengaluru, Delhi NCR and Hyderabad. Swap your home directly or stay with credits.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'SwapStay — Travel by swapping homes',
    description:
      'Exchange homes with verified members across India. Transparent SwapScores, mutual consent and a credit wallet that keeps every stay fair.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <ToastProvider>
          <AuthProvider>
            <AppChrome header={<SiteHeader />} footer={<SiteFooter />}>
              {children}
            </AppChrome>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
