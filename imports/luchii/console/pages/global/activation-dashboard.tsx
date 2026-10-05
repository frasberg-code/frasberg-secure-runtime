import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface ActivationState {
  phase: string;
  status: 'pending' | 'running' | 'complete';
  readiness: any;
  deployment: any;
  autonomousLoops: any;
}

export default function ActivationDashboard() {
  const [state, setState] = useState<ActivationState | null>(null);
  const [activating, setActivating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleFullActivation = async () => {
    setActivating(true);
    setLogs(['🚀 Starting Frasberg Autonomous Cloud Activation...']);

    try {
      const response = await api.post('/activation/full-activation');
      setState(response);
      setLogs((prev) => [...prev, '✅ Activation Complete!', JSON.stringify(response, null, 2)]);
    } catch (error: any) {
      setLogs((prev) => [...prev, `❌ Error: ${error.message}`]);
    } finally {
      setActivating(false);
    }
  };

  return (
    <main className="p-8 max-w-6xl mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-5xl font-bold mb-2">🚀 Autonomous Cloud Activation</h1>
      <p className="text-xl text-gray-300 mb-8">The moment the cloud wakes up and becomes self-driving.</p>

      {/* Activation Button */}
      <div className="bg-blue-900 p-6 rounded-lg mb-8 border-2 border-blue-500">
        <h2 className="text-2xl font-bold mb-4">🔥 Full Activation Sequence</h2>
        <p className="text-gray-300 mb-6">
          This will initialize the entire autonomous cloud ecosystem, wire the control plane, activate lifecycle loops,
          check readiness, and deploy core regions.
        </p>
        <button
          onClick={handleFullActivation}
          disabled={activating}
          className={`px-8 py-3 rounded-lg font-bold text-lg ${
            activating
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 cursor-pointer'
          }`}
        >
          {activating ? '⏳ Activating...' : '🎬 START ACTIVATION'}
        </button>
      </div>

      {/* Logs */}
      <div className="bg-black p-6 rounded-lg border border-gray-700 font-mono text-sm mb-8">
        <h3 className="text-lg font-bold mb-4">Activation Logs</h3>
        <div className="space-y-2 max-h-96 overflow-auto">
          {logs.map((log, idx) => (
            <div key={idx} className={log.startsWith('✅') ? 'text-green-400' : 'text-gray-400'}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      {state && (
        <div className="grid grid-cols-2 gap-6">
          {/* Readiness */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4">📋 Readiness</h3>
            <div className="space-y-2">
              <div>
                <p className="text-gray-400">Status</p>
                <p className={`text-2xl font-bold ${state.readiness.status === 'GO' ? 'text-green-400' : 'text-red-400'}`}>
                  {state.readiness.status}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Items Passed</p>
                <p className="text-2xl font-bold text-blue-400">{state.readiness.passed}/{state.readiness.total}</p>
              </div>
              <div>
                <p className="text-gray-400">Completion</p>
                <div className="w-full bg-gray-700 rounded h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded"
                    style={{ width: `${state.readiness.percentComplete}%` }}
                  />
                </div>
                <p className="text-sm mt-1">{state.readiness.percentComplete}%</p>
              </div>
            </div>
          </div>

          {/* Deployment */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4">🌍 Deployment</h3>
            <div className="space-y-2">
              <div>
                <p className="text-gray-400">Active Regions</p>
                <p className="text-2xl font-bold text-green-400">{state.deployment.activeRegions}</p>
              </div>
              <div>
                <p className="text-gray-400">Pending Regions</p>
                <p className="text-2xl font-bold text-yellow-400">{state.deployment.pendingRegions}</p>
              </div>
              <div>
                <p className="text-gray-400">Completion</p>
                <div className="w-full bg-gray-700 rounded h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded"
                    style={{ width: `${state.deployment.completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous Loops */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 col-span-2">
            <h3 className="text-xl font-bold mb-4">⚙️ Autonomous Loops</h3>
            <div className="grid grid-cols-4 gap-4">
              {state.autonomousLoops.loops?.map((loop: any, idx: number) => (
                <div key={idx} className="bg-gray-900 p-3 rounded border border-gray-600">
                  <p className="text-sm font-medium">{loop.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {loop.status === 'running' ? '✓ Running' : '○ Stopped'}
                  </p>
                  <p className="text-xs text-gray-500">{loop.interval}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {state && (
        <div className="mt-8 bg-green-900 p-6 rounded-lg border border-green-500">
          <h3 className="text-xl font-bold mb-4">🎉 Activation Complete!</h3>
          <p className="text-gray-200 mb-4">
            Frasberg Autonomous Cloud is now operating. Next steps:
          </p>
          <ul className="space-y-2">
            {state.nextSteps?.map((step: string, idx: number) => (
              <li key={idx} className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
