import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface DashboardData {
  health: any;
  stability: any;
  auditRecent: any[];
  policies: any;
}

export default function AcoDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/aco/dashboard');
      setDashboard(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading ACO Dashboard...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!dashboard) return <div className="p-8">No data available</div>;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Autonomous Cloud Operations</h1>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Health Score */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Global Health</h2>
          <div className="text-5xl font-bold text-green-600">
            {(dashboard.health.health_score || 0).toFixed(1)}%
          </div>
          <p className="text-gray-600 mt-2">System Health Score</p>
        </section>

        {/* SLA Health */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">SLA Health</h2>
          <div className="text-5xl font-bold text-blue-600">
            {(dashboard.health.sla_health || 0).toFixed(1)}%
          </div>
          <p className="text-gray-600 mt-2">SLA Compliance</p>
        </section>
      </div>

      {/* Stability Metrics */}
      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Stability Metrics</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Approved Decisions</p>
            <p className="text-2xl font-bold">{dashboard.stability.approved || 0}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Rejected Decisions</p>
            <p className="text-2xl font-bold">{dashboard.stability.rejected || 0}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Total Decisions</p>
            <p className="text-2xl font-bold">{dashboard.stability.total || 0}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Approval Rate</p>
            <p className="text-2xl font-bold">
              {dashboard.stability.total > 0
                ? ((dashboard.stability.approved / dashboard.stability.total) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      </section>

      {/* Recent Audit Log */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b">
            <tr>
              <th className="pb-3">Action</th>
              <th className="pb-3">Actor</th>
              <th className="pb-3">Resource</th>
              <th className="pb-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.auditRecent.slice(0, 10).map((log: any, idx: number) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="py-3">{log.action}</td>
                <td className="py-3">{log.actor}</td>
                <td className="py-3 font-mono text-xs">{log.resource.slice(0, 12)}...</td>
                <td className="py-3 text-gray-600">
                  {new Date(log.created_at).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
