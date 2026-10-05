import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface ControlPlaneData {
  acoResponsibilities: { total: number; pending: number };
  health: any;
  globalStability: any;
  federation: any;
  readiness: Record<string, boolean>;
  billing: { revenue30d: number };
}

export default function GlobalControlPlaneDashboard() {
  const [data, setData] = useState<ControlPlaneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolloutStatus, setRolloutStatus] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [cpRes, rolloutRes] = await Promise.all([
        api.get('/global-control-plane/dashboard'),
        api.get('/global-control-plane/rollout-status'),
      ]);
      setData(cpRes);
      setRolloutStatus(rolloutRes);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Global Control Plane...</div>;
  if (!data) return <div className="p-8">Failed to load control plane</div>;

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">🌍 Global Control Plane</h1>

      {/* Readiness Status */}
      <section className="grid grid-cols-5 gap-4 mb-8">
        {Object.entries(data.readiness).map(([key, ready]) => (
          <div
            key={key}
            className={`p-4 rounded-lg text-center ${
              ready ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            } border`}
          >
            <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
            <p className={`text-2xl font-bold ${ready ? 'text-green-600' : 'text-yellow-600'}`}>
              {ready ? '✓' : '⚠'}
            </p>
          </div>
        ))}
      </section>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* ACO Status */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">ACO Status</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Total Responsibilities</p>
              <p className="text-3xl font-bold">{data.acoResponsibilities.total}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Pending Approvals</p>
              <p className="text-3xl font-bold text-orange-600">{data.acoResponsibilities.pending}</p>
            </div>
          </div>
        </section>

        {/* Federation Status */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Federation</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Active Tenants</p>
              <p className="text-3xl font-bold">{data.federation.totalTenants}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Regions</p>
              <p className="text-3xl font-bold">{Object.keys(data.federation.byRegion).length}</p>
            </div>
          </div>
        </section>

        {/* Revenue */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Billing</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Revenue (30d)</p>
              <p className="text-3xl font-bold">${(data.billing.revenue30d || 0).toFixed(0)}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <p className="text-xl font-bold text-green-600">Operational</p>
            </div>
          </div>
        </section>
      </div>

      {/* Rollout Status */}
      {rolloutStatus && (
        <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold mb-4">🚀 Rollout Progress</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-gray-600">Current Phase</p>
              <p className="text-2xl font-bold capitalize">{rolloutStatus.readiness.phase}</p>
            </div>
            <div>
              <p className="text-gray-600">Est. Launch</p>
              <p className="text-2xl font-bold">{new Date(rolloutStatus.readiness.estimatedLaunchDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Readiness</p>
              <div className="w-full bg-gray-200 rounded h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded"
                  style={{ width: `${rolloutStatus.readiness.completionPercentage}%` }}
                />
              </div>
              <p className="text-sm mt-1">{rolloutStatus.readiness.completionPercentage}% complete</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
