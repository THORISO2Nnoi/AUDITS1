"use strict";
/* =========================================================
   Exporter Module — Export CSV, Excel, and PDF files
   ========================================================= */
// Toast Notification helper
function showToast(msg, isSuccess = true) {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px; pointer-events: none;
    `;
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.style.cssText = `
    background: ${isSuccess ? '#0f172a' : '#7f1d1d'};
    color: #fff; border-left: 4px solid ${isSuccess ? '#10b981' : '#ef4444'};
    padding: 12px 18px; border-radius: 8px; font-size: 13px; font-weight: 500;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2); pointer-events: auto;
    display: flex; align-items: center; gap: 10px; transition: all 0.3s ease;
    opacity: 0; transform: translateY(10px);
  `;
    toast.innerHTML = `<span>${isSuccess ? '✅' : '⚠️'}</span><span>${msg}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
// Escape string for CSV format
function escapeCSV(val) {
    if (val === null || val === undefined)
        return '""';
    let str = String(val);
    str = str.replace(/"/g, '""');
    return `"${str}"`;
}
// Trigger browser download link helper
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Export array of objects/rows to CSV file download
function exportToCSV(title, headers, rows, filename) {
    if (!rows || !rows.length) {
        showToast("No data available to export.", false);
        return false;
    }
    let csv = headers.map(escapeCSV).join(",") + "\r\n";
    rows.forEach(row => {
        const line = Array.isArray(row)
            ? row.map(escapeCSV).join(",")
            : headers.map(h => escapeCSV(row[h] !== undefined ? row[h] : "")).join(",");
        csv += line + "\r\n";
    });
    // Add UTF-8 BOM so Excel opens special characters cleanly
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, filename || `${title.toLowerCase().replace(/\s+/g, "_")}_export.csv`);
    showToast(`Successfully downloaded ${filename || 'CSV file'} (${rows.length} rows)`);
    return true;
}
// Export to Excel format (CSV with UTF-8 BOM formatted for Excel)
function exportToExcel(title, headers, rows, filename) {
    return exportToCSV(title, headers, rows, filename || `${title.toLowerCase().replace(/\s+/g, "_")}_export.csv`);
}
// Pure JS PDF Blob Fallback Generator
function generateFallbackPDF(title, headers, rows, filename) {
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; }
        .header { background: #1e3a8a; color: #ffffff; padding: 16px 20px; border-radius: 6px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.85; }
        .meta { margin: 16px 0; font-size: 12px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
        th { background: #f1f5f9; color: #334155; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; }
        td { padding: 7px 10px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🛡️ AUDIT LOG CONSOLE</h1>
        <p>${title}</p>
      </div>
      <div class="meta">
        <strong>Generated Date:</strong> ${new Date().toLocaleString()}<br/>
        <strong>Exported By:</strong> Admin System Administrator<br/>
        <strong>Total Records:</strong> ${rows.length} entries
      </div>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map(row => {
        const cells = Array.isArray(row) ? row : headers.map(h => row[h] !== undefined ? row[h] : "");
        return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    }).join('')}
        </tbody>
      </table>
      <div class="footer">
        Confidential Audit Trail — System Administrator Compliance Report
      </div>
    </body>
    </html>
  `;
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    triggerDownload(blob, (filename || `${title.toLowerCase().replace(/\s+/g, "_")}_report`).replace(/\.pdf$/, '') + ".html");
}
// PDF Export using jsPDF if available, or fallback
function exportToPDF(title, headers, rows, filename) {
    if (!rows || !rows.length) {
        showToast("No data available to export to PDF.", false);
        return false;
    }
    const fname = filename || `${title.toLowerCase().replace(/\s+/g, "_")}_export.pdf`;
    if (window.jspdf && window.jspdf.jsPDF) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            // Title & Header Banner
            doc.setFillColor(30, 58, 138); // Dark Navy Blue (#1e3a8a)
            doc.rect(0, 0, 297, 22, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`AUDIT LOG CONSOLE — ${title.toUpperCase()}`, 14, 14);
            // Metadata Subheader
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            const dateStr = new Date().toLocaleString();
            const userStr = localStorage.getItem("session_name") || "Admin Administrator";
            doc.text(`Generated: ${dateStr}   |   Exported By: ${userStr}   |   Total Records: ${rows.length}`, 14, 28);
            // Table Rows Format
            const formattedBody = rows.map(row => {
                if (Array.isArray(row))
                    return row.map(String);
                return headers.map(h => row[h] !== undefined ? String(row[h]) : "");
            });
            if (typeof doc.autoTable === 'function') {
                doc.autoTable({
                    startY: 32,
                    head: [headers],
                    body: formattedBody,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [30, 58, 138],
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 8.5
                    },
                    styles: {
                        fontSize: 8,
                        cellPadding: 2.5,
                        overflow: 'linebreak'
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252]
                    },
                    margin: { left: 14, right: 14 }
                });
            }
            else {
                // Basic text layout if autoTable is missing
                let y = 36;
                doc.setFontSize(9);
                doc.setTextColor(30, 41, 59);
                formattedBody.forEach(row => {
                    if (y > 190) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(row.join("  |  "), 14, y);
                    y += 7;
                });
            }
            doc.save(fname);
            showToast(`Successfully exported PDF: ${fname}`);
            return true;
        }
        catch (err) {
            console.error("jsPDF generation error:", err);
            generateFallbackPDF(title, headers, rows, fname);
            showToast(`Exported document file: ${fname}`);
            return true;
        }
    }
    else {
        generateFallbackPDF(title, headers, rows, fname);
        showToast(`Exported report file: ${fname}`);
        return true;
    }
}
// Expose Exporter API
const exporterAPI = {
    csv: exportToCSV,
    excel: exportToExcel,
    pdf: exportToPDF,
    toast: showToast
};
window.Exporter = exporterAPI;
//# sourceMappingURL=exporter.js.map