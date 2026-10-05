import React, { useState } from 'react';
import { api, setAuthToken } from '../lib/api';

type Step = 'create' | 'configure' | 'activate' | 'complete';

export default function AutonomousOnboarding() {
  const [step, setStep] = useState<Step>('create');
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    region: 'us-west',
    tier: 'basic',
  });

  const handleCreateTenant = async () => {
    setLoading(true);
    try {
      const response = await api.post('/onboarding/create-tenant', {
        name: formData.name,
        email: formData.email,
      });
      setTenant(response.tenant);
      setAuthToken(response.token);
      setStep('configure');
    } catch (error) {
      console.error('Failed to create tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async () => {
    setLoading(true);
    try {
      await api.post(`/onboarding/${tenant.id}/configure`, {
        region: formData.region,
        tier: formData.tier,
      });
      setStep('activate');
    } catch (error) {
      console.error('Failed to configure:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      await api.post(`/onboarding/${tenant.id}/activate`);
      setStep('complete');
    } catch (error) {
      console.error('Failed to activate:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Autonomous Cloud</h1>

        {step === 'create' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Create Tenant</h2>
            <input
              type="text"
              placeholder="Tenant Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-4 py-2 mb-4"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border rounded px-4 py-2 mb-6"
            />
            <button
              onClick={handleCreateTenant}
              disabled={loading || !formData.name || !formData.email}
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        )}

        {step === 'configure' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Configure Autonomy</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Region</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full border rounded px-4 py-2"
              >
                <option>us-west</option>
                <option>us-east</option>
                <option>eu-central</option>
                <option>apac</option>
                <option>latam</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Tier</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full border rounded px-4 py-2"
              >
                <option value="basic">Autonomy Basic ($99/mo)</option>
                <option value="pro">Autonomy Pro ($499/mo)</option>
                <option value="enterprise">Autonomy Enterprise ($1,999/mo)</option>
                <option value="sovereign">Autonomy Sovereign ($2,999/mo)</option>
                <option value="ultra">Autonomy Ultra ($4,999/mo)</option>
              </select>
            </div>
            <button
              onClick={handleConfigure}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
            >
              {loading ? 'Configuring...' : 'Continue'}
            </button>
          </div>
        )}

        {step === 'activate' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Ready to Launch</h2>
            <div className="bg-blue-50 p-4 rounded mb-6">
              <p className="text-sm">
                <strong>Tenant:</strong> {tenant?.name}
              </p>
              <p className="text-sm">
                <strong>Tier:</strong> {formData.tier}
              </p>
              <p className="text-sm">
                <strong>Region:</strong> {formData.region}
              </p>
            </div>
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 mb-2"
            >
              {loading ? 'Activating...' : '🚀 Activate Autonomous Cloud'}
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-4">Launch Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your autonomous cloud is now active. Start managing your fleet at the dashboard.
            </p>
            <a
              href="/dashboard"
              className="w-full block bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 text-center"
            >
              Go to Dashboard
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
