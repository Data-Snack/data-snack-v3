import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export interface SnackContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  showLiveData?: boolean;
  showMetaCommentary?: boolean;
}

export function SnackContainer({
  title,
  subtitle,
  children,
  className,
  showLiveData = true,
  showMetaCommentary = true,
}: SnackContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950',
        className,
      )}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-5xl font-bold text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl text-gray-400">{subtitle}</p>
          )}
        </motion.header>

        {/* Main Content */}
        <motion.main
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          {children}
        </motion.main>

        {/* Live Data Stream */}
        {showLiveData && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="fixed right-4 top-20 z-20 w-80"
          >
            <LiveDataStream />
          </motion.div>
        )}

        {/* Meta Commentary */}
        {showMetaCommentary && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="fixed bottom-4 left-4 z-20 max-w-sm"
          >
            <MetaCommentary />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function LiveDataStream() {
  const [events, setEvents] = React.useState<string[]>([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = `Event: ${Math.random().toString(36).substr(2, 9)}`;
      setEvents(prev => [newEvent, ...prev.slice(0, 4)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg border border-purple-500/20 bg-gray-900/80 p-4 backdrop-blur-xl">
      <h3 className="mb-3 text-sm font-semibold text-purple-400">Live Data Stream</h3>
      <div className="space-y-2">
        {events.map((event, i) => (
          <motion.div
            key={`${event}-${i}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-xs text-gray-400"
          >
            {event}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MetaCommentary() {
  const comments = [
    "Big Tech tracks every click you make...",
    "Your data is worth $15,000 per year",
    "You generate 1.7MB of data every second",
    "73% of websites track you without consent",
  ];

  const [currentComment, setCurrentComment] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentComment(prev => (prev + 1) % comments.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg border border-blue-500/20 bg-gray-900/80 p-4 backdrop-blur-xl">
      <h3 className="mb-2 text-sm font-semibold text-blue-400">Did you know?</h3>
      <p className="text-xs text-gray-400">{comments[currentComment]}</p>
    </div>
  );
}
