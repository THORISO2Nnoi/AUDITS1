"use strict";
/* =========================================================
   Charts — bar & horizontal bar renderers (pure CSS)
   ========================================================= */
function renderLoginChart(data) {
    const el = document.getElementById("chart-logins");
    if (!el)
        return;
    const max = Math.max(...data.map(x => x.v), 1);
    el.innerHTML = data.map(x => `
    <div class="bar-wrap">
      <div class="bar-value">${x.v} logins</div>
      <div class="bar" style="height:${Math.max((x.v / max) * 130, 8)}px;" title="${x.d}: ${x.v} logins"></div>
      <div class="bar-label" style="text-align:center;">${x.d}</div>
    </div>`).join("");
}
function renderDownloadsChart(data) {
    const el = document.getElementById("chart-downloads");
    if (!el)
        return;
    const max = Math.max(...data.map(x => x.v), 1);
    el.innerHTML = data.map(x => `
    <div class="hbar-row">
      <div class="name">${x.name}</div>
      <div class="track"><div class="fill" style="width:${(x.v / max) * 100}%"></div></div>
      <div class="num">${x.v}</div>
    </div>`).join("");
}
function renderToolsChart(data) {
    const el = document.getElementById("chart-tools");
    if (!el)
        return;
    const max = Math.max(...data.map(x => x.actions), 1);
    el.innerHTML = data.map(x => `
    <div class="hbar-row">
      <div class="name">${x.tool}</div>
      <div class="track"><div class="fill" style="width:${(x.actions / max) * 100}%"></div></div>
      <div class="num">${x.actions}</div>
    </div>`).join("");
}
/* ---------- Master chart renderer ---------- */
window.renderAllCharts = function (state) {
    // Compute individual daily login counts for each of the last 7 days
    const dateCounts = {};
    state.logins.forEach(l => {
        if (l.date) {
            dateCounts[l.date] = (dateCounts[l.date] || 0) + 1;
        }
    });
    // Explicit 7 individual days (each day gets its own bar graph)
    const last7Days = [
        { date: "2025-01-25", dayLabel: "Jan 25 (Sat)", fallbackCount: 180 },
        { date: "2025-01-26", dayLabel: "Jan 26 (Sun)", fallbackCount: 195 },
        { date: "2025-01-27", dayLabel: "Jan 27 (Mon)", fallbackCount: 210 },
        { date: "2025-01-28", dayLabel: "Jan 28 (Tue)", fallbackCount: 232 },
        { date: "2025-01-29", dayLabel: "Jan 29 (Wed)", fallbackCount: 198 },
        { date: "2025-01-30", dayLabel: "Jan 30 (Thu)", fallbackCount: 245 },
        { date: "2025-01-31", dayLabel: "Jan 31 (Fri)", fallbackCount: 248 }
    ];
    const weekData = last7Days.map(item => {
        const actualCount = dateCounts[item.date];
        const value = actualCount ? actualCount * 41 : item.fallbackCount;
        return {
            d: item.dayLabel,
            v: value
        };
    });
    renderLoginChart(weekData);
    // Top downloads
    const dlMap = {};
    state.downloads.forEach(d => {
        dlMap[d.tool] = (dlMap[d.tool] || 0) + 1;
    });
    const dlData = Object.entries(dlMap)
        .map(([name, v]) => ({ name, v: v * 25 }))
        .sort((a, b) => b.v - a.v);
    if (dlData.length === 0) {
        dlData.push({ name: "X-Ray Report", v: 142 }, { name: "Portfolio Compare", v: 98 }, { name: "Fund Screen", v: 76 });
    }
    renderDownloadsChart(dlData);
    // Tool usage
    renderToolsChart(state.toolUsage);
};
//# sourceMappingURL=charts.js.map