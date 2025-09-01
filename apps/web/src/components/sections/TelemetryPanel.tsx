'use client';

import { useState, useEffect } from 'react';

interface TrackingEvent {
  id: string;
  type: string;
  timestamp: number;
  properties: Record<string, any>;
}

export function TelemetryPanel() {
  const [events, setEvents] = useState<TrackingEvent[]>([]);

  useEffect(() => {
    // placeholder: subscribe to tracking events
    // unsubscribed in cleanup if necessary
    return () => {};
  }, []);

  return (
    <div className="glass rounded-xl p-4">
      <h4 className="font-semibold mb-2">Telemetry</h4>
      <ul className="space-y-1 text-sm">
        {events.map(event => (
          <li key={event.id}>
            {event.type} - {new Date(event.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
