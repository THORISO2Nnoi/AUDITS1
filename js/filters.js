"use strict";
/* =========================================================
   Filters — activity log filtering logic
   ========================================================= */
window.setupFilters = function (state, renderFn) {
    const btn = document.getElementById("applyFilters");
    if (!btn)
        return;
    btn.addEventListener("click", () => {
        const fromInput = document.getElementById("fFrom");
        const toInput = document.getElementById("fTo");
        const brokerInput = document.getElementById("fBroker");
        const toolInput = document.getElementById("fTool");
        const actionInput = document.getElementById("fAction");
        const searchInput = document.getElementById("fSearch");
        const from = fromInput ? fromInput.value : "";
        const to = toInput ? toInput.value : "";
        const broker = brokerInput ? brokerInput.value : "";
        const tool = toolInput ? toolInput.value : "";
        const action = actionInput ? actionInput.value : "";
        const search = searchInput ? searchInput.value.toLowerCase() : "";
        const filtered = state.activity.filter(r => {
            const ts = r.timestamp.slice(0, 10);
            if (from && ts < from)
                return false;
            if (to && ts > to)
                return false;
            if (broker && r.ab_number !== broker)
                return false;
            if (tool && r.tool !== tool)
                return false;
            if (action && r.action !== action)
                return false;
            if (search && !r.details.toLowerCase().includes(search))
                return false;
            return true;
        });
        state.filteredActivity = filtered;
        renderFn(filtered);
    });
    const resetBtn = document.getElementById("resetFilters");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            const fromInput = document.getElementById("fFrom");
            const toInput = document.getElementById("fTo");
            const brokerInput = document.getElementById("fBroker");
            const toolInput = document.getElementById("fTool");
            const actionInput = document.getElementById("fAction");
            const searchInput = document.getElementById("fSearch");
            if (fromInput)
                fromInput.value = "";
            if (toInput)
                toInput.value = "";
            if (brokerInput)
                brokerInput.value = "";
            if (toolInput)
                toolInput.value = "";
            if (actionInput)
                actionInput.value = "";
            if (searchInput)
                searchInput.value = "";
            state.filteredActivity = [...state.activity];
            renderFn(state.filteredActivity);
            if (window.Exporter)
                window.Exporter.toast("Activity log filters reset");
        });
    }
};
//# sourceMappingURL=filters.js.map