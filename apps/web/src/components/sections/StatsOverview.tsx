'use client';

import { useState, useEffect } from 'react';

export function StatsOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    averagePrivacyScore: 0,
  });

  useEffect(() => {
    // placeholder: load stats
  }, []);

  return (
    <div className="glass rounded-xl p-4">
      <h4 className="font-semibold mb-2">Stats Overview</h4>
      <ul className="space-y-1 text-sm">
        <li>Total Users: {stats.totalUsers}</li>
        <li>Total Events: {stats.totalEvents}</li>
        <li>Average Privacy Score: {stats.averagePrivacyScore}</li>
      </ul>
    </div>
  );
}
