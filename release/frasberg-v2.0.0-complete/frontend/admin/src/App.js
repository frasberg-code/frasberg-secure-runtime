import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [services, setServices] = useState({
    canonical: null,
    education: null,
    healthcare: null,
    analytics: null
  });

  useEffect(() => {
    const checkServices = async () => {
      const checks = {
        canonical: fetch('http://localhost:8000/health').then(r => r.json()).catch(() => null),
        education: fetch('http://localhost:8001/health').then(r => r.json()).catch(() => null),
        healthcare: fetch('http://localhost:8002/health').then(r => r.json()).catch(() => null),
        analytics: fetch('http://localhost:5000/health').then(r => r.json()).catch(() => null)
      };

      const results = await Promise.all(Object.values(checks));
      setServices({
        canonical: results[0],
        education: results[1],
        healthcare: results[2],
        analytics: results[3]
      });
    };

    checkServices();
    const interval = setInterval(checkServices, 10000);
    return () => clearInterval(interval);
  }, []);

  const ServiceCard = ({ name, port, status, link }) => (
    <div className={`service-card ${status ? 'healthy' : 'unhealthy'}`}>
      <h3>{name}</h3>
      <p className="port">Port: {port}</p>
      <p className={`status ${status ? 'healthy' : 'unhealthy'}`}>
        {status ? '✅ HEALTHY' : '❌ OFFLINE'}
      </p>
      {status && (
        <a href={link} target="_blank" rel="noopener noreferrer">
          API Docs →
        </a>
      )}
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎯 Frasberg v1.0.0</h1>
        <p className="subtitle">Institution-Grade Operational Intelligence</p>
      </header>

      <main className="dashboard">
        <section className="services-grid">
          <ServiceCard
            name="Canonical Core"
            port="8000"
            status={services.canonical}
            link="http://localhost:8000/docs"
          />
          <ServiceCard
            name="Education Fork"
            port="8001"
            status={services.education}
            link="http://localhost:8001/docs"
          />
          <ServiceCard
            name="Healthcare Fork"
            port="8002"
            status={services.healthcare}
            link="http://localhost:8002/docs"
          />
          <ServiceCard
            name="Analytics"
            port="5000"
            status={services.analytics}
            link="http://localhost:5000/docs"
          />
        </section>

        <section className="system-info">
          <h2>System Status</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Version:</strong> v1.0.0-public-final
            </div>
            <div className="info-item">
              <strong>Architecture:</strong> 45-layer sovereign design
            </div>
            <div className="info-item">
              <strong>Services Active:</strong> {Object.values(services).filter(Boolean).length}/4
            </div>
            <div className="info-item">
              <strong>Fork Isolation:</strong> ✅ Enforced
            </div>
          </div>
        </section>

        <section className="quick-links">
          <h2>Quick Links</h2>
          <div className="links-grid">
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
              Canonical Core API
            </a>
            <a href="http://localhost:8001/docs" target="_blank" rel="noopener noreferrer">
              Education Fork API
            </a>
            <a href="http://localhost:8002/docs" target="_blank" rel="noopener noreferrer">
              Healthcare Fork API
            </a>
            <a href="http://localhost:5000/docs" target="_blank" rel="noopener noreferrer">
              Analytics Dashboard
            </a>
          </div>
        </section>
      </main>

      <footer>
        <p>Frasberg - Institutional-Grade Intelligence | Court-Ready | Auditor-Verified</p>
      </footer>
    </div>
  );
}

export default App;
