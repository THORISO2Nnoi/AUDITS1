/* =========================================================
   Audit Log Console — Login & RBAC Enforcement
   Enforces Admin-only access to Audit Logs, blocking Brokers.
   ========================================================= */

const AB_REGEX: RegExp = /^AB\d{5,7}$/i;

let brokers: BrokersMap = {};
let admins: AdminsMap = {};

/* ---------- Load master data ---------- */
async function loadMasterData(): Promise<void> {
  try {
    const [brokerRes, adminRes] = await Promise.all([
      fetch("data/brokers.json").catch(() => null),
      fetch("data/admins.json").catch(() => null)
    ]);

    if (brokerRes && brokerRes.ok) brokers = await brokerRes.json();
    if (adminRes && adminRes.ok) admins = await adminRes.json();
  } catch (err) {
    console.warn("Could not load master data — using default admin fallback.");
  }

  // Ensure default admin fallback
  if (!admins || Object.keys(admins).length === 0) {
    admins = {
      "ADM001": { name: "System Administrator", email: "admin@company.com", role: "admin" },
      "ADMIN": { name: "System Administrator", email: "admin@company.com", role: "admin" }
    };
  }
}

/* ---------- Audit Log Writer ---------- */
function writeAudit(entry: AuditLogEntry): void {
  const logsStr = localStorage.getItem("audit_login_logs") || "[]";
  const logs: AuditLogEntry[] = JSON.parse(logsStr);
  logs.push({
    ...entry,
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent
  });
  localStorage.setItem("audit_login_logs", JSON.stringify(logs));
  console.log("📝 Audit Entry Recorded:", entry);
}

/* ---------- UI Helpers ---------- */
function showError(msg: string, success: boolean = false): void {
  const box = document.getElementById("errorBox");
  if (!box) return;
  box.innerHTML = msg;
  box.classList.add("show");
  box.classList.toggle("success", success);
}

function hideError(): void {
  const box = document.getElementById("errorBox");
  if (box) box.classList.remove("show");
}

/* ---------- Tab Management ---------- */
function switchRoleTab(role: string): void {
  const activeRoleInput = document.getElementById("activeRole") as HTMLInputElement | null;
  if (activeRoleInput) activeRoleInput.value = role;

  const tabs = document.querySelectorAll<HTMLElement>(".role-tab");
  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.role === role);
  });

  const idLabel = document.getElementById("idLabel");
  const idInput = document.getElementById("userIdentifier") as HTMLInputElement | null;
  const idHint = document.getElementById("idHint");

  if (role === "admin") {
    if (idLabel) idLabel.textContent = "Admin ID / Email";
    if (idInput) idInput.placeholder = "ADM001 or admin@company.com";
    if (idHint) idHint.textContent = "Authorized Administrator ID (e.g. ADM001 or admin@company.com)";
  } else {
    if (idLabel) idLabel.textContent = "AB Number";
    if (idInput) idInput.placeholder = "AB12345";
    if (idHint) idHint.textContent = "Broker AB Number (Note: Brokers cannot view Audit Logs)";
  }
}

/* ---------- Quick Demo Fill ---------- */
function setupQuickFill(): void {
  const adminBtn = document.getElementById("demoAdminBtn");
  const brokerBtn = document.getElementById("demoBrokerBtn");

  if (adminBtn) {
    adminBtn.addEventListener("click", () => {
      switchRoleTab("admin");
      const idInput = document.getElementById("userIdentifier") as HTMLInputElement | null;
      const pwdInput = document.getElementById("password") as HTMLInputElement | null;
      if (idInput) idInput.value = "ADM001";
      if (pwdInput) pwdInput.value = "Admin@1234";
      hideError();
    });
  }

  if (brokerBtn) {
    brokerBtn.addEventListener("click", () => {
      switchRoleTab("broker");
      const idInput = document.getElementById("userIdentifier") as HTMLInputElement | null;
      const pwdInput = document.getElementById("password") as HTMLInputElement | null;
      if (idInput) idInput.value = "AB12345";
      if (pwdInput) pwdInput.value = "Test@1234";
      hideError();
    });
  }
}

/* ---------- Login Submit Handler ---------- */
async function handleLogin(e: Event): Promise<void> {
  e.preventDefault();
  hideError();

  const idInput = document.getElementById("userIdentifier") as HTMLInputElement | null;
  const pwdInput = document.getElementById("password") as HTMLInputElement | null;
  const btn = document.getElementById("loginBtn") as HTMLButtonElement | null;
  const activeRoleInput = document.getElementById("activeRole") as HTMLInputElement | null;

  if (!idInput || !pwdInput || !btn || !activeRoleInput) return;

  const activeRole = activeRoleInput.value;
  const rawId = idInput.value.trim();
  const pwd = pwdInput.value;
  const upperId = rawId.toUpperCase();

  idInput.classList.remove("invalid");
  pwdInput.classList.remove("invalid");

  if (!rawId || !pwd) {
    showError("Please enter both login identifier and password.");
    return;
  }

  // Determine if login attempt is a Broker
  const isBrokerId = AB_REGEX.test(rawId) || !!brokers[upperId] || activeRole === "broker";

  /* =========================================================
     RBAC RULE ENFORCEMENT: BROKERS DENIED AUDIT LOG ACCESS
     ========================================================= */
  if (isBrokerId) {
    idInput.classList.add("invalid");
    const brokerName = brokers[upperId] ? brokers[upperId].name : "Broker";
    
    // Write security audit log for unauthorized access attempt
    writeAudit({
      user_id: rawId,
      user_name: brokerName,
      role: "broker",
      status: "Failure",
      reason: "Access Denied: Broker accounts are restricted from accessing Audit Logs"
    });

    showError(
      `<strong>🚫 Access Denied (RBAC Violation):</strong><br/>` +
      `Brokers (${rawId}) are not authorized to view the Audit Log Console. ` +
      `Only Administrators can sign in.`
    );
    return;
  }

  /* =========================================================
     ADMIN AUTHENTICATION
     ========================================================= */
  btn.disabled = true;
  btn.textContent = "Authenticating…";

  try {
    // Find matching admin account
    let adminRecord = admins[upperId] || admins[rawId.toLowerCase()];
    if (!adminRecord) {
      // Check by email
      const matchedKey = Object.keys(admins).find(
        k => admins[k].email && admins[k].email.toLowerCase() === rawId.toLowerCase()
      );
      if (matchedKey) adminRecord = admins[matchedKey];
    }

    // Default admin validation if ADM001 / admin@company.com
    if (!adminRecord && (upperId === "ADM001" || rawId.toLowerCase() === "admin@company.com" || upperId === "ADMIN")) {
      adminRecord = {
        name: "System Administrator",
        email: "admin@company.com",
        role: "admin",
        department: "Security & Compliance"
      };
    }

    if (!adminRecord) {
      idInput.classList.add("invalid");
      writeAudit({
        user_id: rawId,
        role: "unknown",
        status: "Failure",
        reason: "Unknown Admin ID"
      });
      showError("Administrator ID or Email not found. Please check your credentials.");
      return;
    }

    // Validate password (demo rule: min 6 chars)
    if (pwd.length < 6) {
      pwdInput.classList.add("invalid");
      writeAudit({
        user_id: rawId,
        role: "admin",
        status: "Failure",
        reason: "Invalid password"
      });
      showError("Invalid password. Password must be at least 6 characters.");
      return;
    }

    // Successful Admin Login
    const adminId = upperId.startsWith("ADM") ? upperId : "ADM001";
    
    writeAudit({
      user_id: adminId,
      user_name: adminRecord.name,
      email: adminRecord.email,
      role: adminRecord.role || "admin",
      status: "Success",
      details: "Admin authenticated for Audit Console"
    });

    const rememberCheck = document.getElementById("remember") as HTMLInputElement | null;
    if (rememberCheck && rememberCheck.checked) {
      localStorage.setItem("remembered_admin", adminId);
    } else {
      localStorage.removeItem("remembered_admin");
    }

    // Save Admin session
    localStorage.setItem("session_role", adminRecord.role || "admin");
    localStorage.setItem("session_ab", adminId);
    localStorage.setItem("session_name", adminRecord.name);
    localStorage.setItem("session_email", adminRecord.email);

    showError("✅ Admin authenticated successfully. Redirecting to Audit Console…", true);
    setTimeout(() => { window.location.href = "dashboard.html"; }, 600);

  } catch (err) {
    showError("Authentication error. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In to Audit Console";
  }
}

/* ---------- Password show/hide ---------- */
function setupPasswordToggle(): void {
  const btn = document.getElementById("togglePwd") as HTMLButtonElement | null;
  const pwd = document.getElementById("password") as HTMLInputElement | null;
  if (!btn || !pwd) return;
  btn.addEventListener("click", () => {
    const visible = pwd.type === "text";
    pwd.type = visible ? "password" : "text";
    btn.textContent = visible ? "👁" : "🙈";
  });
}

/* ---------- Prefill & Query Param Check ---------- */
function checkQueryParamsAndPrefill(): void {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("unauthorized") === "true" || urlParams.get("error") === "unauthorized") {
    showError("<strong>🚫 Unauthorized Access Attempt:</strong><br/>Your session does not have Administrator privileges. Please sign in as an Admin.");
  }

  const savedAdmin = localStorage.getItem("remembered_admin");
  if (savedAdmin) {
    switchRoleTab("admin");
    const idInput = document.getElementById("userIdentifier") as HTMLInputElement | null;
    const rememberCheck = document.getElementById("remember") as HTMLInputElement | null;
    if (idInput) idInput.value = savedAdmin;
    if (rememberCheck) rememberCheck.checked = true;
  }
}

/* ---------- Init ---------- */
async function initLogin(): Promise<void> {
  await loadMasterData();
  setupPasswordToggle();
  setupQuickFill();
  checkQueryParamsAndPrefill();

  // Tab click listeners
  document.querySelectorAll<HTMLElement>(".role-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const role = tab.dataset.role;
      if (role) switchRoleTab(role);
    });
  });

  const form = document.getElementById("loginForm");
  if (form) form.addEventListener("submit", handleLogin);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLogin);
} else {
  initLogin();
}
