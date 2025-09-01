'use client';

import { motion } from 'framer-motion';
import { Button } from '@data-snack/ui';
import { useDataSnack } from '@data-snack/tracking';

export function Hero() {
  const { track } = useDataSnack();

  const handleGetStarted = () => {
    track('hero_cta_click', {
      action: 'get_started',
      timestamp: Date.now(),
    });
  };

  return (
    <div className="text-center max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-6xl md:text-8xl font-bold text-gradient mb-8">
          Data Snack
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
          ðª Entdecke in <strong className="text-primary">30 Sekunden</strong>, 
          was Big Tech Ã¼ber dich weiÃ - transparent, ehrlich und lehrreich.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Button
            size="lg"
            className="btn-primary text-lg px-8 py-4"
            onClick={handleGetStarted}
          >
            ð Jetzt starten
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            className="btn-ghost text-lg px-8 py-4"
            onClick={() => {
              track('hero_learn_more_click', {
                action: 'learn_more',
                timestamp: Date.now(),
              });
            }}
          >
            ð Mehr erfahren
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="glass rounded-2xl p-6">
            <div className="text-3xl mb-4">ð</div>
            <h3 className="text-xl font-semibold mb-2">Transparent</h3>
            <p className="text-muted-foreground">
              Sieh genau, welche Daten erfasst werden - ohne Verstecken
            </p>
          </div>
          
          <div className="glass rounded-2xl p-6">
            <div className="text-3xl mb-4">ð</div>
            <h3 className="text-xl font-semibold mb-2">Lehrreich</h3>
            <p className="text-muted-foreground">
              Lerne durch Selbsterfahrung Ã¼ber deine digitale IdentitÃ¤t
            </p>
          </div>
          
          <div className="glass rounded-2xl p-6">
            <div className="text-3xl mb-4">ð¡ï¸</div>
            <h3 className="text-xl font-semibold mb-2">Privacy-First</h3>
            <p className="text-muted-foreground">
              GDPR-konform mit vollstÃ¤ndiger Consent-Kontrolle
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
