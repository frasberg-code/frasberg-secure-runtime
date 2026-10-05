import React from 'react';

export default function PricingPage() {
  return (
    <main className="w-full">
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">Pricing & Plans</h1>
          <p className="text-xl opacity-90">
            Choose the autonomy tier that's right for your enterprise
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Pricing Table */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left p-6">Feature</th>
                  <th className="text-center p-6">Basic</th>
                  <th className="text-center p-6">Pro</th>
                  <th className="text-center p-6">Enterprise</th>
                  <th className="text-center p-6">Sovereign</th>
                  <th className="text-center p-6">Ultra</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: 'Monthly Price',
                    basic: '$99',
                    pro: '$499',
                    enterprise: '$1,999',
                    sovereign: '$2,999',
                    ultra: '$4,999',
                  },
                  {
                    feature: 'Autonomy Mode',
                    basic: 'Assist',
                    pro: 'Full',
                    enterprise: 'Full',
                    sovereign: 'Full',
                    ultra: 'Full',
                  },
                  {
                    feature: 'SLA Guarantee',
                    basic: '99.5%',
                    pro: '99.9%',
                    enterprise: '99.95%',
                    sovereign: '99.99%',
                    ultra: '99.99%',
                  },
                  {
                    feature: 'Regions',
                    basic: '1',
                    pro: '3',
                    enterprise: '7',
                    sovereign: '7',
                    ultra: '7',
                  },
                  {
                    feature: 'Tenants',
                    basic: '1',
                    pro: '1',
                    enterprise: '1',
                    sovereign: '1',
                    ultra: 'Unlimited',
                  },
                  {
                    feature: 'Cost Optimization',
                    basic: '✓',
                    pro: '✓',
                    enterprise: '✓',
                    sovereign: '✓',
                    ultra: '✓',
                  },
                  {
                    feature: 'Compliance',
                    basic: '-',
                    pro: 'Standard',
                    enterprise: 'GDPR/HIPAA',
                    sovereign: 'Regional',
                    ultra: 'All',
                  },
                  {
                    feature: 'Support',
                    basic: 'Email',
                    pro: 'Priority',
                    enterprise: '24/7',
                    sovereign: '24/7',
                    ultra: 'Dedicated',
                  },
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="text-left p-6 font-medium">{row.feature}</td>
                    <td className="text-center p-6">{row.basic}</td>
                    <td className="text-center p-6">{row.pro}</td>
                    <td className="text-center p-6">{row.enterprise}</td>
                    <td className="text-center p-6">{row.sovereign}</td>
                    <td className="text-center p-6">{row.ultra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Billing Details */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">How Billing Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold mb-4">Base Fee</h3>
              <p className="text-gray-600 mb-4">
                Monthly subscription based on your tier, includes:
              </p>
              <ul className="space-y-2 text-sm">
                <li>✓ Unlimited API calls</li>
                <li>✓ Automatic failover</li>
                <li>✓ Standard compliance</li>
                <li>✓ 100 GB storage</li>
                <li>✓ Email support</li>
              </ul>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold mb-4">Usage Charges</h3>
              <p className="text-gray-600 mb-4">
                Per-event billing for autonomous actions:
              </p>
              <ul className="space-y-2 text-sm">
                <li>✓ Decisions: $0.01</li>
                <li>✓ Actions: $0.05</li>
                <li>✓ Recovery events: $0.10</li>
                <li>✓ Optimization credits: -$0.02</li>
                <li>✓ Custom pricing available</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I upgrade or downgrade my tier?',
                a: 'Yes, you can change tiers at any time. Changes take effect immediately.',
              },
              {
                q: 'What if I exceed my region limit?',
                a: 'Additional regions are available at $500/month each for any tier.',
              },
              {
                q: 'Is there a long-term discount?',
                a: 'Yes! Annual plans receive 15% discount, multi-year plans up to 25% off.',
              },
              {
                q: 'Can I get a custom pricing plan?',
                a: 'Absolutely. Contact sales@frasberg.ai for enterprise pricing.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
