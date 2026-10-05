import React from 'react';

export default function ArchitecturePage() {
  return (
    <main className="w-full">
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Architecture</h1>
          <p className="text-xl opacity-90">
            Understand how the Frasberg Autonomous Cloud works
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* System Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">System Architecture</h2>
          <div className="bg-white p-8 rounded-lg shadow">
            <pre className="text-sm overflow-x-auto">
              {`┌─────────────────────────────────────────────┐
│          Presentation Layer               │
│  (Consoles, Website, Status Pages)        │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│          REST API (v1)                      │
│  (/aco, /tiers, /billing, /federation)     │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│        Service Layer                        │
│  (ACO, Billing, Federation, Docs)          │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│        Data Layer (PostgreSQL)              │
│  (Multi-region, replicated, backed up)     │
└─────────────────────────────────────────────┘`}
            </pre>
          </div>
        </section>

        {/* Key Components */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Components</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Global Brain',
                description: 'Central policy engine that makes autonomous decisions',
              },
              {
                name: 'Memory System',
                description: 'Distributed state management with history tracking',
              },
              {
                name: 'Governance Engine',
                description: 'ACO decision approval and enterprise controls',
              },
              {
                name: 'Safety Envelope',
                description: 'Constitutional constraints and operational bounds',
              },
              {
                name: 'Fusion Loop',
                description: 'Real-time decision making and action execution',
              },
              {
                name: 'Recovery System',
                description: 'Autonomous healing and failure recovery',
              },
              {
                name: 'Federation Layer',
                description: 'Multi-tenant coordination and load balancing',
              },
              {
                name: 'Audit Trail',
                description: 'Complete logging of all operations for compliance',
              },
            ].map((component, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="font-bold mb-2">{component.name}</h3>
                <p className="text-gray-600 text-sm">{component.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Model */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Data Model</h2>
          <div className="bg-white p-8 rounded-lg shadow overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b">
                <tr>
                  <th className="pb-3">Entity</th>
                  <th className="pb-3">Purpose</th>
                  <th className="pb-3">Scale</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { entity: 'Tenants', purpose: 'Customer accounts and tier management', scale: '10K+' },
                  { entity: 'ACO Decisions', purpose: 'Governance approvals and policies', scale: '1M+' },
                  { entity: 'Billing Events', purpose: 'Usage tracking and invoicing', scale: '10M+' },
                  { entity: 'Health Status', purpose: 'Regional and tenant metrics', scale: '100M+' },
                  { entity: 'Audit Logs', purpose: 'Compliance and security audits', scale: '100M+' },
                  { entity: 'Partners', purpose: 'Ecosystem management', scale: '1K+' },
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-3 font-medium">{row.entity}</td>
                    <td className="py-3">{row.purpose}</td>
                    <td className="py-3 font-mono text-xs">{row.scale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Technology Stack */}
        <section>
          <h2 className="text-3xl font-bold mb-8">Technology Stack</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                layer: 'Frontend',
                tech: ['React 18', 'TypeScript', 'Tailwind CSS', 'REST API'],
              },
              {
                layer: 'Backend',
                tech: ['Node.js 18', 'Express.js', 'TypeScript', 'JWT Auth'],
              },
              {
                layer: 'Database',
                tech: ['PostgreSQL 15', 'Connection Pooling', 'Replication', 'Backups'],
              },
              {
                layer: 'Infrastructure',
                tech: ['Kubernetes', 'Docker', 'Prometheus', 'HPA'],
              },
              {
                layer: 'Security',
                tech: ['TLS/SSL', 'Role-Based Access', 'Audit Logging', 'Input Validation'],
              },
              {
                layer: 'Monitoring',
                tech: ['Prometheus', 'Grafana', 'ELK Stack', 'Custom Metrics'],
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-4 text-blue-600">{item.layer}</h3>
                <ul className="space-y-2">
                  {item.tech.map((t, tidx) => (
                    <li key={tidx} className="text-sm">
                      ✓ {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
