// public/js/sensor_history.js

(function () {
  const sensorId = window.sensorId || (document.body.dataset.sensorId || "");
  const startEl = document.getElementById("start");
  const endEl   = document.getElementById("end");
  const form    = document.getElementById("range-form");
  const resetBt = document.getElementById("reset");
  const pdfBt   = document.getElementById("pdf");
  const statsEl = document.getElementById("stats");
  const tbody   = document.querySelector("#data-table tbody");

  let chart; // guarda instância para destruir antes de recriar

  function toLocalDTInput(iso) {
    const d = new Date(iso);
    const pad = n => String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function renderChart(labels, values) {
    const ctx = document.getElementById("histChart").getContext("2d");
    if (chart) chart.destroy(); // evita “Canvas is already in use”
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels.map(x => new Date(x)),
        datasets: [{
          label: "Temperatura (°C)",
          data: values,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        parsing: false,
        scales: {
          x: { type: "time", time: { unit: "hour" } },
          y: { ticks: { callback: v => v + "°C" } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  async function loadData(startISO, endISO) {
    const url = new URL(window.location.origin + "/metrics/sensor-history-range");
    url.searchParams.set("id", sensorId);
    if (startISO) url.searchParams.set("start", startISO);
    if (endISO)   url.searchParams.set("end", endISO);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("Hist range error", await res.text());
      statsEl.textContent = "Erro a obter dados.";
      tbody.innerHTML = "";
      renderChart([], []);
      return;
    }
    const { labels=[], values=[], rows=[], stats } = await res.json();

    if (rows.length) {
      const s = stats || {};
      statsEl.textContent = `Mín: ${s.min}°C • Máx: ${s.max}°C • Média: ${s.avg}°C`;
    } else {
      statsEl.textContent = "Sem dados no intervalo selecionado.";
    }

    renderChart(labels, values);
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${new Date(r.timestamp).toLocaleString()}</td>
        <td>${r.temperature}°C</td>
        <td>${r.rssi ?? "—"}</td>
        <td>${r.battery != null ? r.battery + "%" : "—"}</td>
      </tr>
    `).join("");
  }

  // Inicial: usa valores que puseste no EJS (injetar via data-* se quiseres)
  (function initialLoadFromInputs() {
    const s = new Date(startEl.value);
    const e = new Date(endEl.value);
    const startISO = new Date(s.getTime() - s.getTimezoneOffset()*60000).toISOString();
    const endISO   = new Date(e.getTime() - e.getTimezoneOffset()*60000).toISOString();
    loadData(startISO, endISO);
  })();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const s = new Date(startEl.value);
    const e2 = new Date(endEl.value);
    const startISO = new Date(s.getTime() - s.getTimezoneOffset()*60000).toISOString();
    const endISO   = new Date(e2.getTime() - e2.getTimezoneOffset()*60000).toISOString();
    loadData(startISO, endISO);
  });

  resetBt.addEventListener("click", () => {
    const now = new Date();
    const start = new Date(now.getTime() - 24*60*60*1000);
    startEl.value = toLocalDTInput(start.toISOString());
    endEl.value   = toLocalDTInput(now.toISOString());
  });

  // PDF
  document.getElementById("pdf")?.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    const name = (window.sensorName || sensorId);
    doc.text(`Histórico de Temperatura — ${name} (${sensorId})`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Intervalo: ${new Date(startEl.value).toLocaleString()} — ${new Date(endEl.value).toLocaleString()}`, 40, 58);

    const rows = Array.from(tbody.querySelectorAll("tr")).map(tr => {
      const tds = tr.querySelectorAll("td");
      return [tds[0].textContent, tds[1].textContent, tds[2].textContent, tds[3].textContent];
    });

    doc.autoTable({
      head: [["Timestamp", "Temperatura", "RSSI", "Bateria"]],
      body: rows,
      startY: 80,
      styles: { fontSize: 9 },
      theme: "grid",
      didDrawPage: () => {
        const str = `HACCP Guard — ${new Date().toLocaleString()}`;
        doc.setFontSize(9);
        doc.text(str, 40, doc.internal.pageSize.getHeight()-20);
      }
    });

    doc.save(`historico_${sensorId}.pdf`);
  });
})();
