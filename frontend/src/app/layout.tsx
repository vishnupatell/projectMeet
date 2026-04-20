import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/components/providers/StoreProvider';
import { AuthInitializer } from '@/components/providers/AuthInitializer';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ProjectMeet - Video Conferencing & Chat',
  description: 'A scalable, production-grade video conferencing and real-time chat application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.className} ${manrope.variable}`}>
        <StoreProvider>
          <AuthInitializer>
            {children}
          </AuthInitializer>
        </StoreProvider>
      </body>
    </html>
  );
}
