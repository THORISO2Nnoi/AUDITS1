# Audit Log Console (TypeScript)

Audit Log & Compliance Administration Console with **Role-Based Access Control (RBAC)**, written in **TypeScript**.

## 📂 Structure

- `src/` — **TypeScript Source Code**
  - `types.ts` — Data contracts, interfaces, and DOM window global type declarations
  - `login.ts` — Login authentication controller & RBAC enforcement
  - `dashboard.ts` — Main audit log console controller & view renderer
  - `exporter.ts` — Export logic (CSV, Excel, PDF generation & toast notifications)
  - `charts.ts` — Pure CSS chart rendering logic
  - `filters.ts` — Activity log filtering logic
- `js/` — Compiled JavaScript output (generated via `npm run build`)
- `index.html` — Login portal (Role-aware Admin vs Broker authentication)
- `dashboard.html` — Audit console (8 views for authorized Admins)
- `css/` — Stylesheets (login styling, dashboard layout, charts)
- `data/` — Sample JSON data (`admins.json`, `brokers.json`, `activity.json`, etc.)
- `docs/` — Specifications & documentation (`AUTH.md`)
- `tsconfig.json` — TypeScript compiler configuration
- `package.json` — NPM project configuration & build scripts

## 🛠 TypeScript Build Scripts

- **Compile TypeScript**: `npm run build`
- **Watch Mode**: `npm run watch`
- **Type Checking**: `npm run type-check`

## 🔑 Demo Logins

### 👑 Admin Access (Can view Audit Console)
- **ID / Email**: `ADM001` or `admin@company.com`
- **Password**: `Admin@1234`
- **Result**: Authenticates successfully and grants access to `dashboard.html`.

### 👤 Broker Attempt (Restricted from Audit Console)
- **AB Number**: `AB12345`
- **Password**: `Test@1234`
- **Result**: **Access Denied**. Displays an error stating Brokers cannot view Audit Logs and records a security audit log entry.

## 🔒 Security & RBAC

- **Role Restriction**: Only users with role `admin` or `audit.viewer` are allowed to access `dashboard.html`.
- **Broker Prohibition**: Brokers are blocked from viewing audit logs.
- **Unauthorized Navigation Guard**: Direct URL access to `dashboard.html` without Admin session role redirects to `index.html?error=unauthorized`.
- **Audit Log Trail**: All authentication attempts, including unauthorized broker access attempts, are permanently recorded in the audit log.