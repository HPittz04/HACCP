import { Router } from "express";
import api from "../lib/apiClient.js";
import axios from "axios";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const [data, sensores, hist] = await Promise.all([
      api.getOverview(),
      api.getSensors(),
      api.getTempHistory(6)
    ]);
    res.render("pages/overview", { data, sensores, hist, page: "overview" });
  } catch (err) {
    res.status(500).render("pages/error", { error: err, page: "error" });
  }
});

router.get("/sensors.json", async (req, res) => {
  try {
    const sensores = await api.getSensors();
    res.json(sensores);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});


router.get("/sensores", async (req, res) => {
  try {
    const sensores = await api.getSensors();
    res.render("pages/sensors", { sensores, page: "sensors" });
  } catch (err) {
    res.status(500).render("pages/error", { error: err, page: "error" });
  }
});

router.get("/alarmes", async (req, res) => {
  try {
    const alarmes = await api.getAlarms();
    res.render("pages/alarms", { alarmes, page: "alarms" });
  } catch (err) {
    res.status(500).render("pages/error", { error: err, page: "error" });
  }
});

// JSON: histórico médio de temperatura (proxy para a API)
router.get("/metrics/avg-temp", async (req, res) => {
  try {
    const hours = Number(req.query.hours || 6);
    const data = await api.getTempHistory(hours);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});
// Histórico de um sensor (JSON)
// Query: ?id=<sensorId>&mins=<minutos>
router.get("/metrics/sensor-history", async (req, res) => {
  try {
    const id = req.query.id;
    const mins = Number(req.query.mins || 120);
    if (!id) return res.status(400).json({ error: "missing id" });

    const data = await api.getSensorHistory(id, mins);
    res.json(data); // {labels, values, stats?}
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// PÁGINA: histórico do sensor
router.get("/sensores/:id/historico", async (req, res) => {
  try {
    const id = req.params.id;

    // valores default: últimas 24h
    const end = new Date();
    const start = new Date(end.getTime() - 24*60*60*1000);

    // Para mostrar nos inputs do HTML (datetime-local)
    const toLocalInput = (d) => {
      const pad = (n) => String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth()+1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };

    // Se tiveres endpoint para metadados do sensor, podes preencher:
    let sensor = null;
    try {
      // opcional: api.getSensor(id)
      sensor = null;
    } catch {}

    res.render("pages/sensor_history", {
      id,
      sensor,
      startLocal: toLocalInput(start),
      endLocal: toLocalInput(end),
      startISO: new Date(start.getTime() - start.getTimezoneOffset()*60000).toISOString(),
      endISO: new Date(end.getTime() - end.getTimezoneOffset()*60000).toISOString(),
      page: "sensores",
    });
  } catch (err) {
    res.status(500).render("pages/error", { error: err, page: "error" });
  }
});

// API JSON: histórico por intervalo
router.get("/metrics/sensor-history-range", async (req, res) => {
  try {
    const id = String(req.query.id || "");
    const startISO = req.query.start ? String(req.query.start) : null;
    const endISO   = req.query.end   ? String(req.query.end)   : null;
    if (!id) return res.status(400).json({ error: "missing id" });

    // --- MODO MOCK ---
    if (process.env.MOCK === "1") {
      // intervalo: por omissão últimas 24h
      const end   = endISO   ? new Date(endISO)   : new Date();
      const start = startISO ? new Date(startISO) : new Date(end.getTime() - 24*60*60*1000);

      const stepMs = 5 * 60 * 1000; // ponto a cada 5 minutos
      const labels = [];
      const values = [];
      const rows = [];

      // ponto de partida “típico” por id (frio negativo se contiver 'arca' ou '-')
      let v = /arca|freeze|congela|-/i.test(id) ? -18 : 3.5;

      for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
        // random walk suave
        v += (Math.random() - 0.5) * 0.2; // +-0.1
        v = Math.max(-25, Math.min(10, v)); // limites

        const ts = new Date(t).toISOString();
        const temp = Number(v.toFixed(2));
        labels.push(ts);
        values.push(temp);
        rows.push({
          timestamp: ts,
          temperature: temp,
          rssi: Math.floor(-80 + Math.random() * 10),     // mock
          battery: Math.max(5, Math.floor(90 - (t-start.getTime())/ (24*60*60*10))) // mock
        });
      }

      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a,b)=>a+b,0) / (values.length || 1);
      return res.json({
        labels,
        values,
        rows,
        stats: { min: Number(min.toFixed(2)), max: Number(max.toFixed(2)), avg: Number(avg.toFixed(2)) }
      });
    }

    // --- FUTURO: quando tiveres backend real, usa isto: ---
    // const base = process.env.DASHBOARD_API_BASE || "http://localhost:8000";
    // const url = `${base}/sensors/${encodeURIComponent(id)}/readings`;
    // const { default: axios } = await import("axios");
    // const { data: rows } = await axios.get(url, { params: { start: startISO, end: endISO } });
    // const labels = rows.map(r => r.timestamp);
    // const values = rows.map(r => r.temperature);
    // let stats = null;
    // if (values.length) {
    //   const min = Math.min(...values);
    //   const max = Math.max(...values);
    //   const avg = values.reduce((a,b)=>a+b,0) / values.length;
    //   stats = { min: Number(min.toFixed(2)), max: Number(max.toFixed(2)), avg: Number(avg.toFixed(2)) };
    // }
    // return res.json({ labels, values, rows, stats });

  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;

