import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = { withCredentials: true };

export const fetchOverview = () => axios.get(`${API}/admin/mesh/overview`, ax).then((r) => r.data);
export const fetchMeshMetrics = () => axios.get(`${API}/admin/mesh/metrics`, ax).then((r) => r.data);
export const fetchRegions = () => axios.get(`${API}/admin/mesh/regions`, ax).then((r) => r.data);
export const fetchClients = () => axios.get(`${API}/admin/mesh/clients`, ax).then((r) => r.data);
export const fetchQueueStats = () => axios.get(`${API}/admin/mesh/queue`, ax).then((r) => r.data);
export const fetchVoiceStats = () => axios.get(`${API}/admin/mesh/voice-stats`, ax).then((r) => r.data);
export const disconnectClient = (id) => axios.post(`${API}/admin/mesh/clients/${id}/disconnect`, {}, ax).then((r) => r.data);
export const broadcastMessage = (message) => axios.post(`${API}/admin/mesh/broadcast`, { message }, ax).then((r) => r.data);
export const flushQueue = () => axios.post(`${API}/admin/mesh/queue/flush`, {}, ax).then((r) => r.data);
export const failoverRegion = (region) => axios.post(`${API}/admin/mesh/failover`, { region }, ax).then((r) => r.data);
export const rotateMeshKey = () => axios.post(`${API}/admin/mesh/rotate-key`, {}, ax).then((r) => r.data);
