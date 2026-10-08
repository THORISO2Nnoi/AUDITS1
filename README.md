# Audit Log Console (TypeScript & .NET EF Core)

Audit Log & Compliance Administration Console with **Role-Based Access Control (RBAC)**, built using **HTML5, Vanilla CSS, and TypeScript** for the frontend, with **.NET Entity Framework Core (EF Core)** backend integration.

## ⚡ Key Features
- **Pure CSS Charts & Layout**: Responsive UI without heavy charting libraries.
- **Strict Role-Based Access Control (RBAC)**: Admin vs Broker authentication.
- **Entity Framework Core Integration**: Pre-configured C# entity models and `DbContext`.

---

## 🗄️ Database Schema & .NET Entity Framework (EF Core)

### Table: `audit_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Auto-increment primary key |
| `ab_number` | VARCHAR(9) | FK to brokers |
| `session_id` | VARCHAR(64) | Per-session identifier |
| `timestamp` | TIMESTAMP | UTC timestamp |
| `ip_address` | VARCHAR(45) | IPv4 or IPv6 address |
| `user_agent` | TEXT | Client browser / device string |
| `tool` | VARCHAR(64) | Tool name or `NULL` |
| `action` | VARCHAR(32) | Login / View / Generate / Download |
| `details` | TEXT | Audit details / free text |
| `status` | ENUM | `Success` / `Failure` |
| `report_name` | VARCHAR(255) | Name of report if action is download |
| `report_format` | VARCHAR(16) | PDF / Excel / CSV |

**Indexes**: `ab_number`, `timestamp`, `tool`, `action`

### 💻 .NET Entity Framework Core Model (`AuditLog.cs`)

```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AuditLogConsole.Models
{
    public enum AuditStatus
    {
        Success,
        Failure
    }

    [Table("audit_logs")]
    [Index(nameof(AbNumber))]
    [Index(nameof(Timestamp))]
    [Index(nameof(Tool))]
    [Index(nameof(Action))]
    public class AuditLog
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("ab_number")]
        [MaxLength(9)]
        public string? AbNumber { get; set; }

        [Column("session_id")]
        [MaxLength(64)]
        public string? SessionId { get; set; }

        [Column("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Column("ip_address")]
        [MaxLength(45)]
        public string? IpAddress { get; set; }

        [Column("user_agent")]
        public string? UserAgent { get; set; }

        [Column("tool")]
        [MaxLength(64)]
        public string? Tool { get; set; }

        [Column("action")]
        [MaxLength(32)]
        public string Action { get; set; } = string.Empty;

        [Column("details")]
        public string? Details { get; set; }

        [Column("status")]
        public AuditStatus Status { get; set; }

        [Column("report_name")]
        [MaxLength(255)]
        public string? ReportName { get; set; }

        [Column("report_format")]
        [MaxLength(16)]
        public string? ReportFormat { get; set; }
    }

    public class AuditDbContext : DbContext
    {
        public AuditDbContext(DbContextOptions<AuditDbContext> options) : base(options) { }

        public DbSet<AuditLog> AuditLogs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.Property(e => e.Status)
                      .HasConversion<string>();
            });
        }
    }
}
```

---

## 🌐 REST Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate AB + password |
| `POST` | `/api/audit/log` | Write an audit entry |
| `GET` | `/api/audit/activity` | List activity logs |
| `GET` | `/api/audit/logins` | List login logs |
| `GET` | `/api/audit/downloads` | List downloads |
| `GET` | `/api/audit/security` | Security events |
| `GET` | `/api/audit/broker-summary` | Broker analytics |
| `GET` | `/api/audit/tool-usage` | Tool analytics |
| `POST` | `/api/audit/export` | Generate CSV/PDF/Excel |

---

## 🛡️ Security, Retention & RBAC

- **Retention**: 7 years (regulatory compliance), Immutable (append-only).
- **RBAC**: Only `audit.viewer` and `admin` roles can access the console.
- **Audit Log Trail**: Every export and authentication attempt is permanently logged.

---

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

---

## 🛠 TypeScript Build Scripts

- **Compile TypeScript**: `npm run build`
- **Watch Mode**: `npm run watch`
- **Type Checking**: `npm run type-check`

---

## 🔑 Demo Logins

### 👑 Admin Access (Can view Audit Console)
- **ID / Email**: `ADM001` or `admin@company.com`
- **Password**: `Admin@1234`
- **Result**: Authenticates successfully and grants access to `dashboard.html`.

### 👤 Broker Attempt (Restricted from Audit Console)
- **AB Number**: `AB12345`
- **Password**: `Test@1234`
- **Result**: **Access Denied**. Displays an error stating Brokers cannot view Audit Logs and records a security audit log entry.
