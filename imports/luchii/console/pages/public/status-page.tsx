import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function PublicStatusPage() {
  const [overview, setOverview] = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const [overviewRes, regionsRes] = await Promise.all([
        api.get('/status/public/overview'),
        api.get('/status/public/regions'),
      ]);
      setOverview(overviewRes);
      setRegions(regionsRes.regions);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'operational' ? 'text-green-600' : 'text-yellow-600';
  };

  if (loading) return <div className="p-8 text-center">Loading status...</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">Frasberg Autonomous Cloud Status</h1>
          <p className="text-gray-600 mt-2">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">
        {/* Overall Status */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">System Overview</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-600 text-sm">System Status</p>
              <p className={`text-3xl font-bold ${getStatusColor(overview?.status)}`}>
                {overview?.status || 'Checking...'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active Tenants</p>
              <p className="text-3xl font-bold">{overview?.tenants || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Average Health</p>
              <p className="text-3xl font-bold text-green-600">
                {(overview?.averageHealth || 0).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Global Uptime</p>
              <p className="text-3xl font-bold text-green-600">
                {(overview?.uptime || 0).toFixed(2)}%
              </p>
            </div>
          </div>
        </section>

        {/* Regional Status */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Regional Status</h2>
          <div className="space-y-3">
            {regions.map((region) => (
              <div key={region.region} className="flex items-center justify-between p-4 border rounded">
                <div className="flex-1">
                  <p className="font-semibold capitalize">{region.region}</p>
                  <p className="text-sm text-gray-600">{region.tenants} active tenants</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getStatusColor(region.status)}`}>{region.status}</p>
                  <p className="text-sm text-gray-600">{region.health.toFixed(1)}% health</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Subscribe to updates: <a href="#" className="text-blue-600 hover:underline">status@frasberg.ai</a></p>
        </div>
      </div>
    </main>
  );
}
