import axios from "axios";

const baseURL = process.env.DASHBOARD_API_BASE || "http://localhost:8000";
const timeout = 5000;

const client = axios.create({ baseURL, timeout });

async function getSensors() {
  try {
    const { data } = await client.get("/sensors");
    return data;
  } catch (e) {
    if (process.env.MOCK === "1") {
      return [
        { id: "frigo-01", name: "Frigorífico 01", temp: 3.4, rssi: -68, battery: 87, updated_at: "2025-09-09T08:12:00Z" },
        { id: "arca-02", name: "Arca Congelação 02", temp: -18.2, rssi: -75, battery: 62, updated_at: "2025-09-09T08:10:00Z" }
      ];
    }
    throw e;
  }
}

async function getAlarms() {
  try {
    const { data } = await client.get("/alarms?status=open");
    return data;
  } catch (e) {
    if (process.env.MOCK === "1") {
      return [
        { id: "A-1023", sensor_id: "frigo-01", type: "Temp High", threshold: "≥ 5°C", value: "7.1°C", since: "2025-09-09T07:55:00Z" }
      ];
    }
    throw e;
  }
}

async function getOverview() {
  try {
    const { data } = await client.get("/overview");
    return data;
  } catch (e) {
    if (process.env.MOCK === "1") {
      return { sensors_total: 12, sensors_online: 11, alarms_open: 1, last_sync: "2025-09-09T08:12:00Z" };
    }
    throw e;
  }
}

async function getTempHistory(hours = 6) {
  try {
    // Endpoint real quando tiveres métricas na API:
    // deve devolver { labels: [ISO8601...], values: [Number...] }
    const { data } = await client.get(`/metrics/avg-temp?hours=${hours}`);
    return data;
  } catch (e) {
    if (process.env.MOCK === "1") {
      // Mock: série de 6h com pontos de 5 em 5 minutos (≈72 pontos)
      const now = Date.now();
      const stepMs = 5 * 60 * 1000;
      const n = Math.floor((hours * 60 * 60 * 1000) / stepMs);
      const labels = [];
      const values = [];
      let v = 3.5; // parte de ~3.5°C e faz random walk suave
      for (let i = n; i >= 0; i--) {
        const t = new Date(now - i * stepMs);
        v += (Math.random() - 0.5) * 0.2; // +/-0.1
        v = Math.max(-25, Math.min(10, v)); // trava extremos
        labels.push(t.toISOString());
        values.push(Number(v.toFixed(2)));
      }
      return { labels, values };
    }
    throw e;
  }
}

async function getSensorHistory(sensorId, mins = 120) {
  try {
    // Endpoint real sugerido na tua API:
    // GET /sensors/{id}/history?mins=...
    const { data } = await client.get(`/sensors/${encodeURIComponent(sensorId)}/history?mins=${mins}`);
    return data; // {labels:[ISO], values:[Number], stats:{min,avg,max}}
  } catch (e) {
    if (process.env.MOCK === "1") {
      // Mock: série a cada 2 minutos
      const step = 2; // min
      const points = Math.max(10, Math.floor(mins / step));
      const now = Date.now();
      const labels = [];
      const values = [];
      let v = 3.5 + (Math.random() - 0.5); // começa perto de 3.5°C
      for (let i = points; i >= 0; i--) {
        const t = new Date(now - i * step * 60 * 1000);
        v += (Math.random() - 0.5) * 0.15; // random walk suave
        v = Math.max(-25, Math.min(10, v));
        labels.push(t.toISOString());
        values.push(Number(v.toFixed(2)));
      }
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a,b)=>a+b,0) / values.length;
      return { labels, values, stats: { min: Number(min.toFixed(2)), avg: Number(avg.toFixed(2)), max: Number(max.toFixed(2)) } };
    }
    throw e;
  }
}

export default { getSensors, getAlarms, getOverview, getTempHistory, getSensorHistory };
