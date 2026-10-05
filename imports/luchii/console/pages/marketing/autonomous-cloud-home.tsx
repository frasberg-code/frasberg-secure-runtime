import React from 'react';

export default function AutonomousCloudHome() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Frasberg Autonomous Cloud
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            The self-driving AI cloud that optimizes, heals, and governs itself
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/onboarding"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Get Started
            </a>
            <a
              href="#capabilities"
              className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Why Autonomous */}
      <section id="capabilities" className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-12 text-center">Why Autonomous?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-3">Self-Optimizing</h3>
            <p className="text-gray-600">
              Automatically optimizes across cost, SLA, and resilience without manual tuning
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-bold mb-3">Self-Healing</h3>
            <p className="text-gray-600">
              Detects and recovers from failures automatically across regions and workloads
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold mb-3">Self-Governing</h3>
            <p className="text-gray-600">
              Enterprise-grade controls with autonomous compliance and audit trails
            </p>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Autonomy Tiers</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { name: 'Basic', price: '99', features: ['Assist Mode', 'Cost Optimization'] },
              { name: 'Pro', price: '499', features: ['Full Autonomy', 'SLA Protection'] },
              {
                name: 'Enterprise',
                price: '1,999',
                features: ['Global Autonomy', 'Compliance', 'Governance'],
                featured: true,
              },
              {
                name: 'Sovereign',
                price: '2,999',
                features: ['Region Lock', 'Regulated Compliance'],
              },
              { name: 'Ultra', price: '4,999', features: ['Federation', 'Global Resilience'] },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`p-6 rounded-lg ${
                  tier.featured ? 'bg-blue-600 text-white ring-2 ring-blue-600' : 'bg-white'
                }`}
              >
                <h3 className="font-bold text-lg mb-2">{tier.name}</h3>
                <p className="text-3xl font-bold mb-4">${tier.price}</p>
                <ul className="text-sm space-y-2">
                  {tier.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section className="bg-blue-600 text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform?</h2>
          <p className="text-lg mb-8">
            Launch your autonomous cloud today and start optimizing immediately
          </p>
          <a
            href="/onboarding"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
          >
            Start Free Trial
          </a>
        </div>
      </section>
    </main>
  );
}
