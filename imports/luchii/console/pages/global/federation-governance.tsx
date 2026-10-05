import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface TenantStatus {
  tenantId: string;
  name: string;
  tier: string;
  region: string;
  healthScore: number;
  uptime: number;
  slaHealth: number;
  eventsCount: number;
}

export default function FederationGovernanceConsole() {
  const [tenants, setTenants] = useState<TenantStatus[]>([]);
  const [stability, setStability] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [viewRes, stabilityRes] = await Promise.all([
        api.get('/federation/view'),
        api.get('/federation/stability'),
      ]);
      setTenants(viewRes.data.tenants);
      setStability(stabilityRes.data);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) return <div className="p-8">Loading Federation View...</div>;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Federation Governance Console</h1>

      {/* Global Stability */}
      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Global Stability</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600">Total Tenants</p>
            <p className="text-3xl font-bold">{stability?.total_tenants || 0}</p>
          </div>
          <div>
            <p className="text-gray-600">Avg Health</p>
            <p className="text-3xl font-bold">{(stability?.avg_health || 0).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-600">Avg Uptime</p>
            <p className="text-3xl font-bold">{(stability?.avg_uptime || 0).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-600">Unhealthy</p>
            <p className="text-3xl font-bold text-red-600">{stability?.unhealthy_count || 0}</p>
          </div>
        </div>
      </section>

      {/* Tenant Federation View */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Tenant Federation View</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                <th className="pb-3">Tenant</th>
                <th className="pb-3">Tier</th>
                <th className="pb-3">Region</th>
                <th className="pb-3">Health</th>
                <th className="pb-3">Uptime</th>
                <th className="pb-3">SLA</th>
                <th className="pb-3">Events</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.tenantId} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{tenant.name}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {tenant.tier}
                    </span>
                  </td>
                  <td className="py-3">{tenant.region}</td>
                  <td className={`py-3 font-bold ${getHealthColor(tenant.healthScore)}`}>
                    {tenant.healthScore.toFixed(1)}%
                  </td>
                  <td className="py-3">{tenant.uptime.toFixed(1)}%</td>
                  <td className={`py-3 font-bold ${getHealthColor(tenant.slaHealth)}`}>
                    {tenant.slaHealth.toFixed(1)}%
                  </td>
                  <td className="py-3">{tenant.eventsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
