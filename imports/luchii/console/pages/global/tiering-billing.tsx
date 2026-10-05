import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Tier {
  tier: string;
  features: string[];
  pricing: any;
  sla_guarantees: any;
}

export default function TiersAndBillingConsole() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [currentTier, setCurrentTier] = useState<string>('basic');
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tiersRes, tierRes, billingRes] = await Promise.all([
        api.get('/tiers/list'),
        api.get('/tiers/tenant'),
        api.get('/billing/summary'),
      ]);
      setTiers(tiersRes.data.tiers);
      setCurrentTier(tierRes.data.tier);
      setBilling(billingRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeTier = async (newTier: string) => {
    try {
      await api.post('/tiers/tenant', { tier: newTier });
      setCurrentTier(newTier);
    } catch (error) {
      console.error('Failed to upgrade tier:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Autonomy Tiers & Billing</h1>

      {/* Available Tiers */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Available Tiers</h2>
        <div className="grid grid-cols-5 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className={`border-2 rounded-lg p-4 ${
                currentTier === tier.tier ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <h3 className="font-bold mb-2 capitalize">{tier.tier}</h3>
              <p className="text-sm text-gray-600 mb-3">
                ${tier.pricing?.monthly || 0}/month
              </p>
              <ul className="text-xs space-y-1 mb-4">
                {(tier.features || []).slice(0, 3).map((f) => (
                  <li key={f} className="text-gray-600">
                    ✓ {f.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgradeTier(tier.tier)}
                disabled={currentTier === tier.tier}
                className={`w-full py-2 px-3 rounded text-sm font-medium ${
                  currentTier === tier.tier
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {currentTier === tier.tier ? 'Current' : 'Select'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Billing Summary */}
      {billing && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Billing Summary</h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-600">Total Units</p>
              <p className="text-4xl font-bold">{billing.totalUnits}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Amount</p>
              <p className="text-4xl font-bold">${(billing.totalAmount || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Events Breakdown */}
          <div>
            <h3 className="font-semibold mb-3">Events by Type</h3>
            <table className="w-full text-left text-sm">
              <thead className="border-b">
                <tr>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Count</th>
                  <th className="pb-2">Units</th>
                  <th className="pb-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(billing.byKind || {}).map(([kind, data]: [string, any]) => (
                  <tr key={kind} className="border-b">
                    <td className="py-2">{kind}</td>
                    <td className="py-2">{data.count}</td>
                    <td className="py-2">{data.units}</td>
                    <td className="py-2">${data.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
