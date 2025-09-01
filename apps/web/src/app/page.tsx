import { Suspense } from 'react';
import { Metadata } from 'next';
import { Hero } from '@/components/sections/Hero';
import { SnackGrid } from '@/components/sections/SnackGrid';
import { StatsOverview } from '@/components/sections/StatsOverview';
import { TelemetryPanel } from '@/components/sections/TelemetryPanel';
import { ConsentBanner } from '@data-snack/tracking/react';
import { PageTracking } from '@/components/tracking/PageTracking';

export const metadata: Metadata = {
  title: 'Data Snack - Entdecke deine digitale DNA',
  description: 'Interaktive Data Snacks zeigen transparent, was Big Tech Ã¼ber dich weiÃ. Lerne durch Selbsterfahrung Ã¼ber Tracking, Privacy und deine digitale IdentitÃ¤t.',
  openGraph: {
    title: 'Data Snack - Entdecke deine digitale DNA',
    description: 'Interaktive Data Snacks zeigen transparent, was Big Tech Ã¼ber dich weiÃ',
    images: ['/og-home.png'],
  },
};

export default function HomePage() {
  return (
    <>
      {/* Page Tracking */}
      <PageTracking pageName="home" />
      
      {/* Consent Management */}
      <ConsentBanner
        onAcceptAll={() => {
          // Analytics: Track full consent
          console.log('User granted full consent');
        }}
        onDeclineAll={() => {
          // Analytics: Track minimal consent
          console.log('User declined tracking');
        }}
        onCustomize={() => {
          // Open consent customization
          console.log('User wants to customize consent');
        }}
      />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <Hero />
      </section>
      
      {/* Statistics Overview */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gradient mb-4">
              ð Live Analytics Dashboard
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sieh in Echtzeit, wie Tracking funktioniert - transparent und ehrlich.
            </p>
          </div>
          
          <Suspense fallback={
            <div className="glass rounded-2xl p-8 animate-pulse">
              <div className="h-48 bg-white/5 rounded-xl"></div>
            </div>
          }>
            <StatsOverview />
          </Suspense>
        </div>
      </section>
      
      {/* Data Snacks Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gradient mb-4">
              ðª Interaktive Data Snacks
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Entdecke in 30 Sekunden bis 5 Minuten, was Big Tech Ã¼ber dich weiÃ. 
              Jeder Snack ist eine Lernerfahrung Ã¼ber deine digitale IdentitÃ¤t.
            </p>
          </div>
          
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                  <div className="h-32 bg-white/5 rounded-xl mb-4"></div>
                  <div className="h-4 bg-white/5 rounded mb-2"></div>
                  <div className="h-3 bg-white/5 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          }>
            <SnackGrid />
          </Suspense>
        </div>
      </section>
      
      {/* Telemetry Panel */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gradient mb-4">
              ð Live Telemetry
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sieh live, welche Daten gerade erfasst werden. Absolute Transparenz.
            </p>
          </div>
          
          <Suspense fallback={
            <div className="glass rounded-2xl p-8 animate-pulse">
              <div className="h-96 bg-white/5 rounded-xl"></div>
            </div>
          }>
            <TelemetryPanel />
          </Suspense>
        </div>
      </section>
      
      {/* Footer with Privacy Info */}
      <footer className="py-16 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-4">ð¡ï¸ Privacy First</h3>
              <p className="text-muted-foreground mb-4">
                Wir sammeln Daten nur mit deiner Einwilligung und zeigen dir 
                transparent, was wir tun.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  GDPR Compliant
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Open Source
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Consent Mode v2
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4">ð Ãber Data Snack</h3>
              <p className="text-muted-foreground mb-4">
                Ein Bildungsprojekt, das zeigt, wie Tracking funktioniert - 
                transparent, ehrlich und lehrreich.
              </p>
              <div className="space-y-2">
                <a href="/about" className="block text-primary hover:text-primary/80">
                  Ãber das Projekt
                </a>
                <a href="/methodology" className="block text-primary hover:text-primary/80">
                  Methodik
                </a>
                <a href="/privacy" className="block text-primary hover:text-primary/80">
                  Datenschutz
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4">ð Links</h3>
              <div className="space-y-2">
                <a 
                  href="https://github.com/data-snack/v3" 
                  className="block text-primary hover:text-primary/80"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repository
                </a>
                <a 
                  href="https://frankbueltge.de" 
                  className="block text-primary hover:text-primary/80"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Author: Frank Bueltge
                </a>
                <a href="/api-docs" className="block text-primary hover:text-primary/80">
                  API Documentation
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-muted-foreground">
            <p>
              Â© 2024 Data Snack. Made with â¤ï¸ for digital privacy education.
            </p>
            <p className="mt-2 text-sm">
              Ein experimentelles Projekt von Frank Bueltge
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
