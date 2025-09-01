'use client';

export function SnackGrid() {
  const snacks = [
    {
      id: 'privacy-leak-detector',
      title: 'ðµï¸ Privacy Leak Detector',
      description: 'Entdecke, was dein Browser Ã¼ber dich verrÃ¤t',
      duration: '2-3 min',
      difficulty: 'Einsteiger',
      category: 'Tracking Exposed',
      xp: 250,
      status: 'available'
    },
    {
      id: 'click-dna-analyzer', 
      title: 'ð±ï¸ Click DNA Analyzer',
      description: 'Deine PersÃ¶nlichkeit aus Click-Patterns',
      duration: '30 sec',
      difficulty: 'Einsteiger', 
      category: 'Tracking Exposed',
      xp: 200,
      status: 'available'
    },
    {
      id: 'scroll-behavior-decoder',
      title: 'ð Scroll Behavior Decoder', 
      description: 'Wie dein Scrollverhalten dich verrÃ¤t',
      duration: '5 min',
      difficulty: 'Fortgeschritten',
      category: 'Tracking Exposed', 
      xp: 350,
      status: 'coming-soon'
    },
    {
      id: 'keyboard-dna-sequencer',
      title: 'â¨ï¸ Keyboard DNA Sequencer',
      description: 'Biometrie durch Tipprhythmus',
      duration: '3 min', 
      difficulty: 'Fortgeschritten',
      category: 'Tracking Exposed',
      xp: 300,
      status: 'coming-soon'
    },
    {
      id: 'social-addiction-radar',
      title: 'ð± Social Addiction Radar',
      description: 'Infinite Scroll Manipulation Analysis',
      duration: '5 min',
      difficulty: 'Expert',
      category: 'Psychological Profiling', 
      xp: 500,
      status: 'coming-soon'
    },
    {
      id: 'dark-pattern-detector',
      title: 'ð³ï¸ Dark Pattern Detector',
      description: 'UX Manipulation Test',
      duration: '4 min',
      difficulty: 'Expert',
      category: 'Psychological Profiling',
      xp: 400,
      status: 'coming-soon'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {snacks.map((snack) => (
        <div 
          key={snack.id} 
          className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
                {snack.category}
              </span>
              {snack.status === 'coming-soon' && (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                  Coming Soon
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              +{snack.xp} XP
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
            {snack.title}
          </h3>
          
          <p className="text-muted-foreground mb-4 leading-relaxed">
            {snack.description}
          </p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                â±ï¸ {snack.duration}
              </span>
              <span className="text-muted-foreground">
                ð {snack.difficulty}
              </span>
            </div>
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-primary font-medium">
                {snack.status === 'available' ? 'Starten â' : 'Bald â'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
