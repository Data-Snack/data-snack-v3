import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { DataSnackProvider } from '@data-snack/tracking';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { TrackingProvider } from '@/components/providers/TrackingProvider';
import { Toaster } from '@/components/ui/toaster';
import { ParticlesBackground } from '@/components/effects/ParticlesBackground';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Data Snack - Transparentes Big-Tech Tracking',
    template: '%s | Data Snack',
  },
  description: 'Entdecke was Big Tech über dich weiß - durch interaktive Data Snacks. Transparente Datenanalyse als Lernerfahrung.',
  keywords: [
    'data privacy',
    'tracking',
    'big tech',
    'data visualization',
    'privacy education',
    'behavioral analysis',
    'fingerprinting',
    'gdpr',
    'transparency'
  ],
  authors: [{ name: 'Frank Bueltge', url: 'https://frankbueltge.de' }],
  creator: 'Frank Bueltge',
  publisher: 'Data Snack',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://data-snack.com'),
  alternates: {
    canonical: '/',
    languages: {
      'de': '/de',
      'en': '/en',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Data Snack',
    title: 'Data Snack - Transparentes Big-Tech Tracking',
    description: 'Entdecke was Big Tech über dich weiß - durch interaktive Data Snacks',
    url: 'https://data-snack.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Data Snack - Transparente Datenanalyse',
      },
    ],
    locale: 'de_DE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Data Snack - Transparentes Big-Tech Tracking',
    description: 'Entdecke was Big Tech über dich weiß',
    creator: '@frankbueltge',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
  },
  category: 'technology',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="hsl(220, 20%, 10%)" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${
          inter.variable
        } ${jetbrainsMono.variable} font-sans antialiased gradient-bg min-h-screen`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TrackingProvider>
            <ParticlesBackground />
            
            <main className="relative z-10">
              {children}
            </main>
            
            <Toaster />
            
            {/* Analytics */}
            <Analytics />
            
            {/* Development Tools */}
            {process.env.NODE_ENV === 'development' && (
              <div className="fixed bottom-4 right-4 z-50">
                <div className="bg-black/90 text-white p-2 rounded text-xs font-mono">
                  DEV MODE
                </div>
              </div>
            )}
          </TrackingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}