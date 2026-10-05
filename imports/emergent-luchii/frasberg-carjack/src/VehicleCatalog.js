// ── Frasberg Vehicle Catalog — Real car industry lineup ──────────────────────
// Tesla, Mercedes-Benz, sports, luxury, trucks — used by TrafficAI & CarShop.

export const VEHICLE_CATALOG = [
  // ── Tesla / Electric ──
  { brand: 'Tesla',         model: 'Cybertruck',        tier: 'truck',    topSpeed: 180, value: 79990,  color: '#b8bcc0', length: 5.9, electric: true },
  { brand: 'Tesla',         model: 'Model S Plaid',     tier: 'luxury',   topSpeed: 322, value: 89990,  color: '#1a1a1a', length: 5.0, electric: true },
  { brand: 'Tesla',         model: 'Model 3',           tier: 'standard', topSpeed: 233, value: 42990,  color: '#c8102e', length: 4.7, electric: true },
  // ── Mercedes-Benz ──
  { brand: 'Mercedes-Benz', model: 'G 63 AMG',          tier: 'luxury',   topSpeed: 220, value: 179000, color: '#101418', length: 4.9 },
  { brand: 'Mercedes-Benz', model: 'S-Class S580',      tier: 'luxury',   topSpeed: 250, value: 117000, color: '#2d2f34', length: 5.3 },
  { brand: 'Mercedes-Benz', model: 'AMG GT',            tier: 'sport',    topSpeed: 315, value: 118000, color: '#c0c3c7', length: 4.5 },
  // ── Supercars / Sports ──
  { brand: 'Ferrari',       model: 'SF90 Stradale',     tier: 'sport',    topSpeed: 340, value: 507000, color: '#d40000', length: 4.7 },
  { brand: 'Lamborghini',   model: 'Huracán EVO',       tier: 'sport',    topSpeed: 325, value: 261000, color: '#9ccb19', length: 4.5 },
  { brand: 'Bugatti',       model: 'Chiron',            tier: 'sport',    topSpeed: 420, value: 3000000, color: '#123d6b', length: 4.5 },
  { brand: 'Porsche',       model: '911 Turbo S',       tier: 'sport',    topSpeed: 330, value: 207000, color: '#e8e6e1', length: 4.5 },
  { brand: 'Chevrolet',     model: 'Corvette Z06',      tier: 'sport',    topSpeed: 312, value: 106000, color: '#f2c800', length: 4.6 },
  // ── Muscle ──
  { brand: 'Dodge',         model: 'Challenger Hellcat', tier: 'muscle',  topSpeed: 327, value: 72000,  color: '#3a3f44', length: 5.0 },
  { brand: 'Ford',          model: 'Mustang GT',        tier: 'muscle',   topSpeed: 250, value: 44000,  color: '#0f4c9c', length: 4.8 },
  // ── Luxury ──
  { brand: 'Rolls-Royce',   model: 'Phantom',           tier: 'luxury',   topSpeed: 250, value: 460000, color: '#0b0b0d', length: 5.8 },
  { brand: 'BMW',           model: 'M4 Competition',    tier: 'sport',    topSpeed: 290, value: 79000,  color: '#0a5c9e', length: 4.8 },
  { brand: 'Range Rover',   model: 'Autobiography',     tier: 'luxury',   topSpeed: 225, value: 152000, color: '#2b3a2f', length: 5.1 },
  // ── Trucks / Utility ──
  { brand: 'Ford',          model: 'F-150 Raptor',      tier: 'truck',    topSpeed: 172, value: 78000,  color: '#5a6570', length: 5.9 },
  { brand: 'RAM',           model: '1500 TRX',          tier: 'truck',    topSpeed: 190, value: 85000,  color: '#7a1f1f', length: 5.9 },
  // ── Standard / Beaters ──
  { brand: 'Toyota',        model: 'Corolla',           tier: 'standard', topSpeed: 180, value: 22000,  color: '#8f9aa3', length: 4.6 },
  { brand: 'Honda',         model: 'Civic',             tier: 'standard', topSpeed: 200, value: 24000,  color: '#3d4f60', length: 4.6 },
  { brand: 'Toyota',        model: 'Camry (Taxi)',      tier: 'beater',   topSpeed: 175, value: 15000,  color: '#f9d71c', length: 4.9 },
  { brand: 'Chevrolet',     model: 'Impala (Beater)',   tier: 'beater',   topSpeed: 160, value: 6000,   color: '#6e6a5e', length: 5.1 },
];

export function randomVehicle() {
  const spec = VEHICLE_CATALOG[Math.floor(Math.random() * VEHICLE_CATALOG.length)];
  return { ...spec, name: `${spec.brand} ${spec.model}`, baseValue: spec.value };
}

export function vehiclesByTier(tier) {
  return VEHICLE_CATALOG.filter(v => v.tier === tier);
}
