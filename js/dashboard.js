"use strict";
/* =========================================================
   Dashboard — loads JSON data, renders all views
   ========================================================= */
const state = {
    brokers: {},
    activity: [],
    logins: [],
    downloads: [],
    security: [],
    brokerSummary: [],
    toolUsage: [],
    exports: [],
    filteredActivity: [],
    schedules: [],
    activeSecIndex: null
};
/* ---------- Data loading ---------- */
async function loadJSON(path) {
    try {
        const res = await fetch(path);
        if (!res.ok)
            throw new Error(path);
        return await res.json();
    }
    catch (err) {
        console.warn("Could not load", path);
        return null;
    }
}
async function loadAllData() {
    const [brokers, activity, logins, downloads, security, brokerSummary, toolUsage, exports] = await Promise.all([
        loadJSON("data/brokers.json"),
        loadJSON("data/activity.json"),
        loadJSON("data/logins.json"),
        loadJSON("data/downloads.json"),
        loadJSON("data/security.json"),
        loadJSON("data/broker-summary.json"),
        loadJSON("data/tool-usage.json"),
        loadJSON("data/exports.json")
    ]);
    state.brokers = brokers || {};
    state.activity = activity || [];
    state.logins = logins || [];
    state.downloads = downloads || [];
    state.security = security || [];
    state.brokerSummary = brokerSummary || [];
    state.toolUsage = toolUsage || [];
    state.exports = exports || [];
    state.filteredActivity = [...state.activity];
    const savedSchedules = localStorage.getItem("audit_schedules");
    state.schedules = JSON.parse(savedSchedules || "[]");
    if (!state.schedules.length) {
        state.schedules = [
            { id: 1, freq: "Daily", email: "compliance@company.com", created: "2025-01-30 08:00:00", lastSent: "Today 08:00 AM" }
        ];
        localStorage.setItem("audit_schedules", JSON.stringify(state.schedules));
    }
}
/* ---------- Helpers ---------- */
function brokerName(ab) {
    return (state.brokers[ab] && state.brokers[ab].name) || ab;
}
function badgeClass(action) {
    const map = {
        Login: "login", View: "view", Download: "download",
        Generate: "generate", "Failed Login": "failed"
    };
    return map[action] || "view";
}
function sevClass(s) {
    return (s || "").toLowerCase();
}
/* ---------- Renderers ---------- */
function renderActivity(rows = state.filteredActivity) {
    const body = document.getElementById("tbl-activity");
    const rowInfo = document.getElementById("rowInfoActivity");
    if (!body)
        return;
    if (!rows.length) {
        body.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:#9ca3af;">No records match the filters.</td></tr>`;
        if (rowInfo)
            rowInfo.textContent = "0 entries";
        return;
    }
    body.innerHTML = rows.map(r => `
    <tr>
      <td>${r.timestamp}</td>
      <td>${r.ab_number}</td>
      <td>${brokerName(r.ab_number)}</td>
      <td>${r.ip}</td>
      <td>${r.tool}</td>
      <td><span class="badge ${badgeClass(r.action)}">${r.action}</span></td>
      <td>${r.details}</td>
      <td class="${r.status === 'Success' ? 'status-ok' : 'status-err'}">${r.status}</td>
    </tr>`).join("");
    if (rowInfo) {
        rowInfo.textContent = `Showing 1–${rows.length} of ${rows.length} entries`;
    }
}
function renderLogins() {
    const body = document.getElementById("tbl-logins");
    if (!body)
        return;
    body.innerHTML = state.logins.map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${r.ab_number}</td>
      <td>${brokerName(r.ab_number)}</td>
      <td>${r.login}</td>
      <td>${r.logout}</td>
      <td>${r.duration}</td>
      <td>${r.ip}</td>
      <td class="${r.status === 'Success' ? 'status-ok' : 'status-err'}">${r.status}</td>
    </tr>`).join("");
}
function renderDownloads() {
    const body = document.getElementById("tbl-downloads");
    if (!body)
        return;
    body.innerHTML = state.downloads.map(r => `
    <tr>
      <td>${r.timestamp}</td>
      <td>${r.ab_number}</td>
      <td>${brokerName(r.ab_number)}</td>
      <td>${r.report}</td>
      <td>${r.tool}</td>
      <td><span class="badge view">${r.format}</span></td>
      <td>${r.size}</td>
      <td class="status-ok">${r.status}</td>
    </tr>`).join("");
}
function updateSecurityKPIs() {
    const crit = state.security.filter(s => s.severity === 'Critical' && s.status === 'Open').length;
    const high = state.security.filter(s => s.severity === 'High' && s.status === 'Open').length;
    const med = state.security.filter(s => s.severity === 'Medium' && s.status === 'Open').length;
    const res = state.security.filter(s => s.status === 'Resolved').length;
    const elCrit = document.getElementById("kpiCritical");
    const elHigh = document.getElementById("kpiHigh");
    const elMed = document.getElementById("kpiMedium");
    const elRes = document.getElementById("kpiResolved");
    if (elCrit)
        elCrit.textContent = String(crit);
    if (elHigh)
        elHigh.textContent = String(high);
    if (elMed)
        elMed.textContent = String(med);
    if (elRes)
        elRes.textContent = String(res);
}
function renderSecurity() {
    const body = document.getElementById("tbl-security");
    if (!body)
        return;
    body.innerHTML = state.security.map((r, i) => `
    <tr>
      <td>${r.timestamp}</td>
      <td><span class="badge ${sevClass(r.severity)}">${r.severity}</span></td>
      <td>${r.type}</td>
      <td>${r.source}</td>
      <td>${r.ip}</td>
      <td>${r.description}</td>
      <td><span class="badge ${r.status === 'Open' ? 'open' : 'resolved'}">${r.status}</span></td>
      <td><button style="background:#1e3a8a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:11.5px;" onclick="openSecurityCard(${i})">View</button></td>
    </tr>`).join("");
    updateSecurityKPIs();
}
function openSecurityCard(index) {
    const item = state.security[index];
    if (!item)
        return;
    state.activeSecIndex = index;
    const timestampEl = document.getElementById("secFieldTimestamp");
    const severityEl = document.getElementById("secFieldSeverity");
    const typeEl = document.getElementById("secFieldType");
    const sourceEl = document.getElementById("secFieldSource");
    const ipEl = document.getElementById("secFieldIP");
    const statusEl = document.getElementById("secFieldStatus");
    const descEl = document.getElementById("secFieldDesc");
    if (timestampEl)
        timestampEl.textContent = item.timestamp;
    if (severityEl)
        severityEl.innerHTML = `<span class="badge ${sevClass(item.severity)}">${item.severity}</span>`;
    if (typeEl)
        typeEl.textContent = item.type;
    if (sourceEl)
        sourceEl.textContent = item.source;
    if (ipEl)
        ipEl.textContent = item.ip;
    if (statusEl)
        statusEl.innerHTML = `<span class="badge ${item.status === 'Open' ? 'open' : 'resolved'}">${item.status}</span>`;
    if (descEl)
        descEl.textContent = item.description;
    const btnResolve = document.getElementById("btnToggleResolve");
    if (btnResolve) {
        if (item.status === 'Open') {
            btnResolve.textContent = "Mark as Resolved";
            btnResolve.className = "btn-resolve";
        }
        else {
            btnResolve.textContent = "Mark as Open";
            btnResolve.className = "btn-reopen";
        }
    }
    const modal = document.getElementById("securityModal");
    if (modal)
        modal.classList.add("active");
}
window.openSecurityCard = openSecurityCard;
function setupSecurityModal() {
    const modal = document.getElementById("securityModal");
    const closeBtn = document.getElementById("btnCloseSecModal");
    const closeX = document.getElementById("btnCloseSecModalX");
    const resolveBtn = document.getElementById("btnToggleResolve");
    const closeModal = () => modal?.classList.remove("active");
    if (closeBtn)
        closeBtn.addEventListener("click", closeModal);
    if (closeX)
        closeX.addEventListener("click", closeModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal)
                closeModal();
        });
    }
    if (resolveBtn) {
        resolveBtn.addEventListener("click", () => {
            if (state.activeSecIndex === null)
                return;
            const item = state.security[state.activeSecIndex];
            if (!item)
                return;
            if (item.status === 'Open') {
                item.status = 'Resolved';
                if (window.Exporter)
                    window.Exporter.toast(`Event "${item.type}" marked as Resolved!`);
            }
            else {
                item.status = 'Open';
                if (window.Exporter)
                    window.Exporter.toast(`Event "${item.type}" marked as Open.`);
            }
            renderSecurity();
            openSecurityCard(state.activeSecIndex);
        });
    }
}
function renderBroker(rows = state.brokerSummary) {
    const tbody = document.getElementById("tbl-broker");
    if (!tbody)
        return;
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#9ca3af;">No brokers match the search.</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.ab_number}</td>
      <td>${brokerName(r.ab_number)}</td>
      <td>${r.logins}</td>
      <td>${r.actions}</td>
      <td>${r.downloads}</td>
      <td>${r.top_tool}</td>
      <td>${r.last_activity}</td>
    </tr>`).join("");
}
function setupBrokerSearch() {
    const searchInput = document.getElementById("fBrokerSearch");
    const resetBtn = document.getElementById("btnResetBrokerSearch");
    if (searchInput) {
        const handleSearch = () => {
            const q = searchInput.value.toLowerCase().trim();
            if (!q) {
                renderBroker(state.brokerSummary);
                return;
            }
            const filtered = state.brokerSummary.filter(r => {
                const name = brokerName(r.ab_number).toLowerCase();
                const ab = (r.ab_number || "").toLowerCase();
                return name.includes(q) || ab.includes(q);
            });
            renderBroker(filtered);
        };
        searchInput.addEventListener("input", handleSearch);
        searchInput.addEventListener("keyup", handleSearch);
    }
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (searchInput)
                searchInput.value = "";
            renderBroker(state.brokerSummary);
            if (window.Exporter)
                window.Exporter.toast("Broker search cleared.");
        });
    }
}
function renderTools() {
    const body = document.getElementById("tbl-tools");
    if (!body)
        return;
    body.innerHTML = state.toolUsage.map(r => `
    <tr>
      <td>${r.tool}</td>
      <td>${r.brokers}</td>
      <td>${r.actions}</td>
      <td>${r.sessions}</td>
      <td>${r.avg}</td>
    </tr>`).join("");
}
function renderExports() {
    const body = document.getElementById("tbl-exports");
    if (!body)
        return;
    body.innerHTML = state.exports.map(r => `
    <tr>
      <td>${r.timestamp}</td>
      <td>${r.exported_by}</td>
      <td>${r.view}</td>
      <td>${r.format}</td>
      <td>${r.rows}</td>
      <td class="status-ok">${r.status}</td>
    </tr>`).join("");
}
function recordExportLog(viewName, format, rowCount) {
    const entry = {
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        exported_by: `${localStorage.getItem("session_name") || "Admin"} (${localStorage.getItem("session_ab") || "ADM001"})`,
        view: viewName,
        format: format,
        rows: `${rowCount} rows`,
        status: "Success"
    };
    state.exports.unshift(entry);
    renderExports();
}
function setupExportButtons() {
    // Activity Log Exports
    const btnActCSV = document.getElementById("btnExportActivityCSV");
    const btnActPDF = document.getElementById("btnExportActivityPDF");
    if (btnActCSV) {
        btnActCSV.addEventListener("click", () => {
            const data = state.filteredActivity.map(r => ({
                "Timestamp": r.timestamp,
                "AB Number": r.ab_number,
                "Broker": brokerName(r.ab_number),
                "IP": r.ip,
                "Tool": r.tool,
                "Action": r.action,
                "Details": r.details,
                "Status": r.status
            }));
            const headers = ["Timestamp", "AB Number", "Broker", "IP", "Tool", "Action", "Details", "Status"];
            if (window.Exporter && window.Exporter.csv("Activity Log", headers, data, "Activity_Log.csv")) {
                recordExportLog("Activity Log", "CSV", data.length);
            }
        });
    }
    if (btnActPDF) {
        btnActPDF.addEventListener("click", () => {
            const data = state.filteredActivity.map(r => ({
                "Timestamp": r.timestamp,
                "AB Number": r.ab_number,
                "Broker": brokerName(r.ab_number),
                "IP": r.ip,
                "Tool": r.tool,
                "Action": r.action,
                "Details": r.details,
                "Status": r.status
            }));
            const headers = ["Timestamp", "AB Number", "Broker", "IP", "Tool", "Action", "Details", "Status"];
            if (window.Exporter && window.Exporter.pdf("Activity Log", headers, data, "Activity_Log.pdf")) {
                recordExportLog("Activity Log", "PDF", data.length);
            }
        });
    }
    // Login Activity Exports
    const btnLoginsCSV = document.getElementById("btnExportLoginsCSV");
    const btnLoginsPDF = document.getElementById("btnExportLoginsPDF");
    if (btnLoginsCSV) {
        btnLoginsCSV.addEventListener("click", () => {
            const data = state.logins.map(r => ({
                "Date": r.date,
                "AB Number": r.ab_number,
                "Broker": brokerName(r.ab_number),
                "Login": r.login,
                "Logout": r.logout,
                "Duration": r.duration,
                "IP": r.ip,
                "Status": r.status
            }));
            const headers = ["Date", "AB Number", "Broker", "Login", "Logout", "Duration", "IP", "Status"];
            if (window.Exporter && window.Exporter.csv("Login Activity", headers, data, "Login_Activity.csv")) {
                recordExportLog("Login Activity", "CSV", data.length);
            }
        });
    }
    if (btnLoginsPDF) {
        btnLoginsPDF.addEventListener("click", () => {
            const data = state.logins.map(r => ({
                "Date": r.date,
                "AB Number": r.ab_number,
                "Broker": brokerName(r.ab_number),
                "Login": r.login,
                "Logout": r.logout,
                "Duration": r.duration,
                "IP": r.ip,
                "Status": r.status
            }));
            const headers = ["Date", "AB Number", "Broker", "Login", "Logout", "Duration", "IP", "Status"];
            if (window.Exporter && window.Exporter.pdf("Login Activity", headers, data, "Login_Activity.pdf")) {
                recordExportLog("Login Activity", "PDF", data.length);
            }
        });
    }
    // Downloads Exports
    const btnDlCSV = document.getElementById("btnExportDownloadsCSV");
    const btnDlPDF = document.getElementById("btnExportDownloadsPDF");
    if (btnDlCSV) {
        btnDlCSV.addEventListener("click", () => {
            const data = state.downloads.map(r => ({
                "Timestamp": r.timestamp,
                "AB Number": r.ab_number,
                "Broker": brokerName(r.ab_number),
                "Report": r.report,
                "Tool": r.tool,
                "Format": r.format,
                "Size": r.size,
                "Status": r.status
            }));
            const headers = ["Timestamp", "AB Number", "Broker", "Report", "Tool", "Format", "Size", "Status"];
            if (window.Exporter && window.Exporter.csv("Report Downloads", headers, data, "Report_Downloads.csv")) {
                recordExportLog("Report Downloads", "CSV", data.length);
            }
        });
    }
    if (btnDlPDF) {
        btnDlPDF.addEventListener("click", () => {
            const data = state.downloads.map(r => ({
                "Timestamp": r.timestamp,
                "AB Number": r.ab_number,
                "Broker": brokerName(r.ab_number),
                "Report": r.report,
                "Tool": r.tool,
                "Format": r.format,
                "Size": r.size,
                "Status": r.status
            }));
            const headers = ["Timestamp", "AB Number", "Broker", "Report", "Tool", "Format", "Size", "Status"];
            if (window.Exporter && window.Exporter.pdf("Report Downloads", headers, data, "Report_Downloads.pdf")) {
                recordExportLog("Report Downloads", "PDF", data.length);
            }
        });
    }
    // Security Exports
    const btnSecCSV = document.getElementById("btnExportSecurityCSV");
    const btnSecPDF = document.getElementById("btnExportSecurityPDF");
    if (btnSecCSV) {
        btnSecCSV.addEventListener("click", () => {
            const data = state.security.map(r => ({
                "Timestamp": r.timestamp,
                "Severity": r.severity,
                "Event Type": r.type,
                "Source": r.source,
                "IP": r.ip,
                "Description": r.description,
                "Status": r.status
            }));
            const headers = ["Timestamp", "Severity", "Event Type", "Source", "IP", "Description", "Status"];
            if (window.Exporter && window.Exporter.csv("Security Events", headers, data, "Security_Events.csv")) {
                recordExportLog("Security Events", "CSV", data.length);
            }
        });
    }
    if (btnSecPDF) {
        btnSecPDF.addEventListener("click", () => {
            const data = state.security.map(r => ({
                "Timestamp": r.timestamp,
                "Severity": r.severity,
                "Event Type": r.type,
                "Source": r.source,
                "IP": r.ip,
                "Description": r.description,
                "Status": r.status
            }));
            const headers = ["Timestamp", "Severity", "Event Type", "Source", "IP", "Description", "Status"];
            if (window.Exporter && window.Exporter.pdf("Security Events", headers, data, "Security_Events.pdf")) {
                recordExportLog("Security Events", "PDF", data.length);
            }
        });
    }
    // Broker Summary Exports
    const btnBrkCSV = document.getElementById("btnExportBrokerCSV");
    const btnBrkPDF = document.getElementById("btnExportBrokerPDF");
    if (btnBrkCSV) {
        btnBrkCSV.addEventListener("click", () => {
            const data = state.brokerSummary.map(r => ({
                "AB Number": r.ab_number,
                "Broker": brokerName(r.ab_number),
                "Logins": r.logins,
                "Actions": r.actions,
                "Downloads": r.downloads,
                "Top Tool": r.top_tool,
                "Last Activity": r.last_activity
            }));
            const headers = ["AB Number", "Broker", "Logins", "Actions", "Downloads", "Top Tool", "Last Activity"];
            if (window.Exporter && window.Exporter.csv("Broker Summary", headers, data, "Broker_Summary.csv")) {
                recordExportLog("Broker Summary", "CSV", data.length);
            }
        });
    }
    if (btnBrkPDF) {
        btnBrkPDF.addEventListener("click", () => {
            const data = state.brokerSummary.map(r => ({
                "AB Number": r.ab_number,
                "Broker": brokerName(r.ab_number),
                "Logins": r.logins,
                "Actions": r.actions,
                "Downloads": r.downloads,
                "Top Tool": r.top_tool,
                "Last Activity": r.last_activity
            }));
            const headers = ["AB Number", "Broker", "Logins", "Actions", "Downloads", "Top Tool", "Last Activity"];
            if (window.Exporter && window.Exporter.pdf("Broker Summary", headers, data, "Broker_Summary.pdf")) {
                recordExportLog("Broker Summary", "PDF", data.length);
            }
        });
    }
    // Tool Usage Exports
    const btnToolCSV = document.getElementById("btnExportToolsCSV");
    const btnToolPDF = document.getElementById("btnExportToolsPDF");
    if (btnToolCSV) {
        btnToolCSV.addEventListener("click", () => {
            const data = state.toolUsage.map(r => ({
                "Tool": r.tool,
                "Unique Brokers": r.brokers,
                "Actions": r.actions,
                "Sessions": r.sessions,
                "Avg Actions / Session": r.avg
            }));
            const headers = ["Tool", "Unique Brokers", "Actions", "Sessions", "Avg Actions / Session"];
            if (window.Exporter && window.Exporter.csv("Tool Usage Analytics", headers, data, "Tool_Usage.csv")) {
                recordExportLog("Tool Usage", "CSV", data.length);
            }
        });
    }
    if (btnToolPDF) {
        btnToolPDF.addEventListener("click", () => {
            const data = state.toolUsage.map(r => ({
                "Tool": r.tool,
                "Unique Brokers": r.brokers,
                "Actions": r.actions,
                "Sessions": r.sessions,
                "Avg Actions / Session": r.avg
            }));
            const headers = ["Tool", "Unique Brokers", "Actions", "Sessions", "Avg Actions / Session"];
            if (window.Exporter && window.Exporter.pdf("Tool Usage Analytics", headers, data, "Tool_Usage.pdf")) {
                recordExportLog("Tool Usage", "PDF", data.length);
            }
        });
    }
}
function setupExportPage() {
    // Quick Export
    const btnQuick = document.getElementById("quickExportBtn");
    if (btnQuick) {
        btnQuick.addEventListener("click", () => {
            const viewSelect = document.getElementById("quickExportView");
            const formatSelect = document.getElementById("quickExportFormat");
            if (!viewSelect || !formatSelect)
                return;
            const viewVal = viewSelect.value;
            const formatVal = formatSelect.value;
            let title = viewVal;
            let headers = [];
            let data = [];
            if (viewVal === "Activity Log") {
                headers = ["Timestamp", "AB Number", "Broker", "IP", "Tool", "Action", "Details", "Status"];
                data = state.filteredActivity.map(r => ({
                    "Timestamp": r.timestamp, "AB Number": r.ab_number, "Broker": brokerName(r.ab_number),
                    "IP": r.ip, "Tool": r.tool, "Action": r.action, "Details": r.details, "Status": r.status
                }));
            }
            else if (viewVal === "Login Activity") {
                headers = ["Date", "AB Number", "Broker", "Login", "Logout", "Duration", "IP", "Status"];
                data = state.logins.map(r => ({
                    "Date": r.date, "AB Number": r.ab_number, "Broker": brokerName(r.ab_number),
                    "Login": r.login, "Logout": r.logout, "Duration": r.duration, "IP": r.ip, "Status": r.status
                }));
            }
            else if (viewVal === "Report Downloads") {
                headers = ["Timestamp", "AB Number", "Broker", "Report", "Tool", "Format", "Size", "Status"];
                data = state.downloads.map(r => ({
                    "Timestamp": r.timestamp, "AB Number": r.ab_number, "Broker": brokerName(r.ab_number),
                    "Report": r.report, "Tool": r.tool, "Format": r.format, "Size": r.size, "Status": r.status
                }));
            }
            else if (viewVal === "Security Events") {
                headers = ["Timestamp", "Severity", "Event Type", "Source", "IP", "Description", "Status"];
                data = state.security.map(r => ({
                    "Timestamp": r.timestamp, "Severity": r.severity, "Event Type": r.type,
                    "Source": r.source, "IP": r.ip, "Description": r.description, "Status": r.status
                }));
            }
            else {
                headers = ["AB Number", "Broker", "Logins", "Actions", "Downloads", "Top Tool", "Last Activity"];
                data = state.brokerSummary.map(r => ({
                    "AB Number": r.ab_number, "Broker": brokerName(r.ab_number), "Logins": r.logins,
                    "Actions": r.actions, "Downloads": r.downloads, "Top Tool": r.top_tool, "Last Activity": r.last_activity
                }));
            }
            const fname = `${viewVal.toLowerCase().replace(/\s+/g, '_')}.${formatVal === 'PDF' ? 'pdf' : 'csv'}`;
            if (window.Exporter) {
                if (formatVal === "PDF") {
                    window.Exporter.pdf(title, headers, data, fname);
                }
                else if (formatVal === "Excel") {
                    window.Exporter.excel(title, headers, data, fname);
                }
                else {
                    window.Exporter.csv(title, headers, data, fname);
                }
            }
            recordExportLog(viewVal, formatVal, data.length);
        });
    }
    // Custom Export
    const btnCustom = document.getElementById("customExportBtn");
    if (btnCustom) {
        btnCustom.addEventListener("click", () => {
            const fromInput = document.getElementById("customExportFrom");
            const toInput = document.getElementById("customExportTo");
            const formatSelect = document.getElementById("customExportFormat");
            const chkLoginsInput = document.getElementById("chkLogins");
            const chkActionsInput = document.getElementById("chkActions");
            const chkDownloadsInput = document.getElementById("chkDownloads");
            const chkSecurityInput = document.getElementById("chkSecurity");
            const from = fromInput ? fromInput.value : "";
            const to = toInput ? toInput.value : "";
            const formatVal = formatSelect ? formatSelect.value : "CSV";
            const chkLogins = chkLoginsInput ? chkLoginsInput.checked : false;
            const chkActions = chkActionsInput ? chkActionsInput.checked : false;
            const chkDownloads = chkDownloadsInput ? chkDownloadsInput.checked : false;
            const chkSecurity = chkSecurityInput ? chkSecurityInput.checked : false;
            let aggregatedRows = [];
            const headers = ["Date/Time", "Category", "User/AB", "Tool/Event", "Details/Status"];
            if (chkLogins) {
                state.logins.forEach(l => {
                    if ((!from || l.date >= from) && (!to || l.date <= to)) {
                        aggregatedRows.push([l.date, "Login Activity", l.ab_number, "Login", `Duration: ${l.duration} (${l.status})`]);
                    }
                });
            }
            if (chkActions) {
                state.activity.forEach(a => {
                    const ts = a.timestamp.slice(0, 10);
                    if ((!from || ts >= from) && (!to || ts <= to)) {
                        aggregatedRows.push([a.timestamp, "Tool Action", a.ab_number, a.tool, `${a.action}: ${a.details}`]);
                    }
                });
            }
            if (chkDownloads) {
                state.downloads.forEach(d => {
                    const ts = d.timestamp.slice(0, 10);
                    if ((!from || ts >= from) && (!to || ts <= to)) {
                        aggregatedRows.push([d.timestamp, "Download", d.ab_number, d.report, `Format: ${d.format} (${d.size})`]);
                    }
                });
            }
            if (chkSecurity) {
                state.security.forEach(s => {
                    const ts = s.timestamp.slice(0, 10);
                    if ((!from || ts >= from) && (!to || ts <= to)) {
                        aggregatedRows.push([s.timestamp, "Security Event", s.source, s.type, `${s.severity} - ${s.description}`]);
                    }
                });
            }
            if (!aggregatedRows.length) {
                if (window.Exporter)
                    window.Exporter.toast("No records found for custom filter selection.", false);
                return;
            }
            const title = "Custom Audit Summary Report";
            const fname = `Custom_Audit_Report.${formatVal === 'PDF' ? 'pdf' : 'csv'}`;
            if (window.Exporter) {
                if (formatVal === "PDF") {
                    window.Exporter.pdf(title, headers, aggregatedRows, fname);
                }
                else {
                    window.Exporter.csv(title, headers, aggregatedRows, fname);
                }
            }
            recordExportLog("Custom Audit Export", formatVal, aggregatedRows.length);
        });
    }
    // Scheduled Reports & Email Dispatch Preview
    renderScheduledList();
    const saveSchedBtn = document.getElementById("saveSchedBtn");
    if (saveSchedBtn) {
        saveSchedBtn.addEventListener("click", () => {
            const freqSelect = document.getElementById("schedFreq");
            const emailInput = document.getElementById("schedEmail");
            if (!freqSelect || !emailInput)
                return;
            const freq = freqSelect.value;
            const email = emailInput.value.trim();
            if (!email || !email.includes("@")) {
                if (window.Exporter)
                    window.Exporter.toast("Please enter a valid recipient email address.", false);
                return;
            }
            const newSched = {
                id: Date.now(),
                freq: freq,
                email: email,
                created: new Date().toISOString().replace('T', ' ').slice(0, 19),
                lastSent: "Pending First Run"
            };
            state.schedules.unshift(newSched);
            localStorage.setItem("audit_schedules", JSON.stringify(state.schedules));
            renderScheduledList();
            if (window.Exporter)
                window.Exporter.toast(`Schedule saved for ${email}! Previewing email dispatch...`);
            openEmailPreview(newSched);
        });
    }
}
function renderScheduledList() {
    const container = document.getElementById("scheduledReportsList");
    if (!container)
        return;
    if (!state.schedules || !state.schedules.length) {
        container.innerHTML = `<p style="font-size:11.5px; color:#94a3b8; margin-top:8px;">No active scheduled reports.</p>`;
        return;
    }
    container.innerHTML = state.schedules.map((s, i) => `
    <div class="scheduled-item">
      <div class="details">
        <span class="email">${s.email}</span>
        <span style="color:#64748b;">${s.freq} Report • Created: ${s.created.slice(0, 10)}</span>
      </div>
      <div class="actions">
        <button class="btn-resolve" style="padding:3px 8px;font-size:11px;" onclick="triggerSchedEmail(${i})">Test Send</button>
        <button class="btn-close-card" style="padding:3px 8px;font-size:11px;color:#dc2626;" onclick="deleteSched(${i})">Delete</button>
      </div>
    </div>
  `).join("");
}
function triggerSchedEmail(idx) {
    const sched = state.schedules[idx];
    if (sched)
        openEmailPreview(sched);
}
function deleteSched(idx) {
    state.schedules.splice(idx, 1);
    localStorage.setItem("audit_schedules", JSON.stringify(state.schedules));
    renderScheduledList();
    if (window.Exporter)
        window.Exporter.toast("Schedule removed.");
}
window.triggerSchedEmail = triggerSchedEmail;
window.deleteSched = deleteSched;
function openEmailPreview(sched) {
    const modal = document.getElementById("emailPreviewModal");
    if (!modal)
        return;
    const emailTargetTo = document.getElementById("emailTargetTo");
    const emailSubject = document.getElementById("emailSubject");
    const emailFreqTag = document.getElementById("emailFreqTag");
    const bodyEl = document.getElementById("emailBodyContent");
    if (emailTargetTo)
        emailTargetTo.textContent = sched.email;
    if (emailSubject)
        emailSubject.textContent = `[Audit Console] ${sched.freq} Compliance Audit Report`;
    if (emailFreqTag)
        emailFreqTag.textContent = sched.freq;
    if (bodyEl) {
        bodyEl.innerHTML = `
      <p>Hello Compliance Officer,</p>
      <p style="margin: 8px 0;">This is your scheduled <strong>${sched.freq} Audit Summary Report</strong> for Audit Log Console.</p>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:6px; margin:10px 0;">
        <strong>📊 Summary Snapshot:</strong><br/>
        • Total Actions Logged: 1,842<br/>
        • Unique Active Brokers: 87<br/>
        • Security Alerts: 2 Critical / 5 High<br/>
        • Attached File: <code>Audit_Report_${sched.freq}_${new Date().toISOString().slice(0, 10)}.pdf</code>
      </div>
      <p style="font-size:11.5px; color:#64748b;">This email is sent automatically to <strong>${sched.email}</strong> per your schedule configuration.</p>
    `;
    }
    modal.classList.add("active");
    const closeX = document.getElementById("btnCloseEmailModalX");
    const closeBtn = document.getElementById("btnCloseEmailModal");
    const sendBtn = document.getElementById("btnSendTestEmail");
    const closeModal = () => modal.classList.remove("active");
    if (closeX)
        closeX.onclick = closeModal;
    if (closeBtn)
        closeBtn.onclick = closeModal;
    if (sendBtn) {
        sendBtn.onclick = () => {
            sched.lastSent = new Date().toLocaleString();
            localStorage.setItem("audit_schedules", JSON.stringify(state.schedules));
            renderScheduledList();
            if (window.Exporter)
                window.Exporter.toast(`📧 Report successfully dispatched to ${sched.email}!`);
            closeModal();
        };
    }
}
/* ---------- Populate filter dropdowns ---------- */
function populateFilters() {
    const brokerSel = document.getElementById("fBroker");
    if (brokerSel) {
        Object.keys(state.brokers).forEach(ab => {
            const opt = document.createElement("option");
            opt.value = ab;
            opt.textContent = `${ab} · ${state.brokers[ab].name}`;
            brokerSel.appendChild(opt);
        });
    }
    const tools = [...new Set(state.activity.map(a => a.tool))];
    const toolSel = document.getElementById("fTool");
    if (toolSel) {
        tools.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t;
            opt.textContent = t;
            toolSel.appendChild(opt);
        });
    }
    const actions = [...new Set(state.activity.map(a => a.action))];
    const actSel = document.getElementById("fAction");
    if (actSel) {
        actions.forEach(a => {
            const opt = document.createElement("option");
            opt.value = a;
            opt.textContent = a;
            actSel.appendChild(opt);
        });
    }
}
/* ---------- Navigation ---------- */
function switchView(view) {
    document.querySelectorAll("aside a").forEach(a => a.classList.toggle("active", a.dataset.view === view));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const el = document.getElementById("view-" + view);
    if (el)
        el.classList.add("active");
}
/* ---------- Session / Logout & RBAC Protection ---------- */
function checkSession() {
    const role = localStorage.getItem("session_role");
    const ab = localStorage.getItem("session_ab");
    // Enforce Admin Access (role must be admin or audit.viewer)
    if (!ab || (role !== "admin" && role !== "audit.viewer")) {
        console.warn("🚫 Access Denied: Unauthorized role attempting dashboard access:", role);
        localStorage.removeItem("session_role");
        localStorage.removeItem("session_ab");
        localStorage.removeItem("session_name");
        localStorage.removeItem("session_email");
        window.location.href = "index.html?error=unauthorized";
        return false;
    }
    const name = localStorage.getItem("session_name") || "System Administrator";
    const userLabel = document.getElementById("userLabel");
    if (userLabel) {
        userLabel.textContent = `👑 Admin: ${name} (${ab})`;
    }
    return true;
}
function setupLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn)
        return;
    logoutBtn.addEventListener("click", () => {
        // Log the logout event
        const logsStr = localStorage.getItem("audit_login_logs") || "[]";
        const logs = JSON.parse(logsStr);
        logs.push({
            user_id: localStorage.getItem("session_ab"),
            user_name: localStorage.getItem("session_name"),
            role: localStorage.getItem("session_role"),
            status: "Logout",
            timestamp: new Date().toISOString()
        });
        localStorage.setItem("audit_login_logs", JSON.stringify(logs));
        localStorage.removeItem("session_ab");
        localStorage.removeItem("session_role");
        localStorage.removeItem("session_name");
        localStorage.removeItem("session_email");
        window.location.href = "index.html";
    });
}
/* ---------- Init ---------- */
async function initDashboard() {
    if (!checkSession())
        return;
    await loadAllData();
    populateFilters();
    renderActivity();
    renderLogins();
    renderDownloads();
    renderSecurity();
    renderBroker();
    renderTools();
    renderExports();
    setupSecurityModal();
    setupBrokerSearch();
    setupExportButtons();
    setupExportPage();
    // Load chart + filter modules
    if (window.renderAllCharts)
        window.renderAllCharts(state);
    if (window.setupFilters)
        window.setupFilters(state, renderActivity);
    document.querySelectorAll("aside a").forEach(a => {
        a.addEventListener("click", () => {
            const view = a.dataset.view;
            if (view)
                switchView(view);
        });
    });
    setupLogout();
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
}
else {
    initDashboard();
}
//# sourceMappingURL=dashboard.js.map