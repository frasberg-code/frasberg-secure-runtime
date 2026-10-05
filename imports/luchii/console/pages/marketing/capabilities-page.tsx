import React from 'react';

export default function CapabilitiesPage() {
  return (
    <main className="w-full">
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Autonomous Cloud Capabilities</h1>
          <p className="text-xl opacity-90">
            Enterprise-grade autonomy that optimizes, heals, and governs itself
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Core Capabilities */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Core Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Self-Optimizing',
                icon: '📈',
                description: 'Automatically optimizes cost, latency, and resilience based on workload patterns',
              },
              {
                title: 'Self-Healing',
                icon: '🔧',
                description: 'Detects and recovers from failures in real-time across regions and services',
              },
              {
                title: 'Self-Governing',
                icon: '🛡️',
                description: 'Enterprise controls with audit trails, compliance, and governance board approval',
              },
              {
                title: 'Multi-Region',
                icon: '🌍',
                description: 'Deploy globally across 7 regions with automatic failover and SLA protection',
              },
              {
                title: 'Multi-Tenant Federation',
                icon: '👥',
                description: 'Unified view of all tenants with cross-tenant load balancing and isolation',
              },
              {
                title: 'Cost Intelligence',
                icon: '💰',
                description: 'Real-time cost tracking and optimization recommendations',
              },
            ].map((cap, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
                <div className="text-4xl mb-3">{cap.icon}</div>
                <h3 className="text-xl font-bold mb-2">{cap.title}</h3>
                <p className="text-gray-600">{cap.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Advanced Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Advanced Features</h2>
          <div className="space-y-6">
            {[
              {
                title: 'Autonomous Lifecycle Management',
                features: [
                  'Automatic epoch rotation',
                  'Continuous evolution cycles',
                  'Self-tuning policies',
                  'Drift detection and correction',
                ],
              },
              {
                title: 'Enterprise Governance',
                features: [
                  'ACO decision approval workflows',
                  'Policy override controls',
                  'Compliance certification',
                  'Audit trail of all operations',
                ],
              },
              {
                title: 'Global SLA Guarantees',
                features: [
                  '99.9% - 99.99% uptime SLAs',
                  'Automatic failover',
                  'Region-aware routing',
                  'Performance isolation',
                ],
              },
              {
                title: 'Compliance & Security',
                features: [
                  'GDPR data residency',
                  'HIPAA compliance bundles',
                  'Sovereign cloud options',
                  'End-to-end audit logging',
                ],
              },
            ].map((section, idx) => (
              <div key={idx} className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">{section.title}</h3>
                <ul className="grid md:grid-cols-2 gap-3">
                  {section.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center">
                      <span className="text-blue-600 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Global Regions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Global Deployment</h2>
          <div className="bg-white p-8 rounded-lg shadow">
            <p className="text-gray-600 mb-6">
              Deploy in any of our 7 global regions with automatic load balancing and SLA protection
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'US West', sla: '99.99%' },
                { name: 'US East', sla: '99.99%' },
                { name: 'EU Central (GDPR)', sla: '99.99%' },
                { name: 'Asia Pacific', sla: '99.95%' },
                { name: 'Latin America', sla: '99.95%' },
                { name: 'Middle East & Africa', sla: '99.9%' },
              ].map((region, idx) => (
                <div key={idx} className="border rounded p-4 text-center">
                  <p className="font-bold">{region.name}</p>
                  <p className="text-sm text-gray-600">SLA: {region.sla}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
