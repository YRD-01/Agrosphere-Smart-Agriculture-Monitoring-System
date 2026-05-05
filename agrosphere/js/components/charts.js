/* ═══════════════════════════════════════════
   js/components/charts.js  —  Chart.js wrappers
═══════════════════════════════════════════ */

const ChartManager = (() => {

  const charts = {};

  // ── Main dashboard chart ─────────────────
  function initMain() {
    const ctx = document.getElementById('chart-main');
    if (!ctx || charts.main) return;

    const h = SensorService.history;

    charts.main = new Chart(ctx, {
      type: 'line',
      data: {
        labels: h.labels.slice(),
        datasets: [
          {
            label: 'Moisture %',
            data: h.moisture.slice(),
            borderColor: '#1E88E5',
            backgroundColor: 'rgba(30,136,229,.08)',
            fill: true,
            tension: .4,
            pointRadius: 2,
            yAxisID: 'y',
          },
          {
            label: 'Temp °C',
            data: h.temp.slice(),
            borderColor: '#FB8C00',
            backgroundColor: 'transparent',
            tension: .4,
            pointRadius: 2,
            yAxisID: 'y2',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#aaa', maxTicksLimit: 8 } },
          y: { position: 'left', min: 0, max: 100, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 9 }, color: '#1E88E5' } },
          y2: { position: 'right', min: 0, max: 50, grid: { display: false }, ticks: { font: { size: 9 }, color: '#FB8C00' } },
        },
      },
    });
  }

  // ── Update main chart with latest history ─
  function updateMainChart() {
    if (!charts.main) return;
    const h = SensorService.history;
    charts.main.data.labels            = h.labels.slice();
    charts.main.data.datasets[0].data  = h.moisture.slice();
    charts.main.data.datasets[1].data  = h.temp.slice();
    charts.main.update('none'); // no animation for live updates
  }

  // ── Irrigation schedule chart ─────────────
  function initSchedule(crops) {
    const ctx = document.getElementById('chart-schedule');
    if (!ctx) return;
    if (charts.schedule) { charts.schedule.destroy(); }

    const colors = ['rgba(30,136,229,.75)', 'rgba(251,140,0,.75)', 'rgba(46,125,50,.75)', 'rgba(156,39,176,.6)'];
    const days   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    charts.schedule = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: (crops && crops.length ? crops : [{ name: 'No crops', water: 0 }]).map((c, i) => ({
          label: c.name,
          data: [c.water, 0, Math.round(c.water * 1.1), 0, c.water, 0, Math.round(c.water * 1.1)],
          backgroundColor: colors[i % colors.length],
          borderRadius: 4,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 10 }, usePointStyle: true, pointStyleWidth: 7 } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 } }, title: { display: true, text: 'L/m²', font: { size: 9 } } },
        },
      },
    });
  }

  // ── Device throughput chart ───────────────
  function initThroughput(devices) {
    const ctx = document.getElementById('chart-throughput');
    if (!ctx) return;
    if (charts.throughput) { charts.throughput.destroy(); }

    const timeLabels = ['60m', '50', '40', '30', '20', '10', 'now'];
    const colors     = ['rgba(46,125,50,.75)', 'rgba(30,136,229,.75)', 'rgba(156,39,176,.6)', 'rgba(251,140,0,.75)'];
    const devs = (devices && devices.length) ? devices.slice(0, 4) : [{ name: 'No devices' }];

    charts.throughput = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: timeLabels,
        datasets: devs.map((d, i) => ({
          label: d.name,
          data: Array.from({ length: 7 }, () => Math.floor(30 + Math.random() * 20)),
          backgroundColor: colors[i % colors.length],
          borderRadius: 3,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 10 }, usePointStyle: true, pointStyleWidth: 7 } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 } }, title: { display: true, text: 'pts/min', font: { size: 9 } } },
        },
      },
    });
  }

  return { initMain, updateMainChart, initSchedule, initThroughput };
})();
