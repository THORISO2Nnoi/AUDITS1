/* =========================================================
   Types & Interfaces for Audit Log Console (Ambient Global)
   ========================================================= */

interface BrokerRecord {
  name: string;
  email?: string;
  department?: string;
  ab_number?: string;
}

type BrokersMap = Record<string, BrokerRecord>;

interface AdminRecord {
  name: string;
  email: string;
  role: string;
  department?: string;
}

type AdminsMap = Record<string, AdminRecord>;

interface ActivityRecord {
  timestamp: string;
  ab_number: string;
  ip: string;
  tool: string;
  action: string;
  details: string;
  status: string;
}

interface LoginRecord {
  date: string;
  ab_number: string;
  login: string;
  logout: string;
  duration: string;
  ip: string;
  status: string;
}

interface DownloadRecord {
  timestamp: string;
  ab_number: string;
  report: string;
  tool: string;
  format: string;
  size: string;
  status: string;
}

type SecuritySeverity = 'Critical' | 'High' | 'Medium' | 'Low' | string;
type SecurityStatus = 'Open' | 'Resolved' | string;

interface SecurityRecord {
  timestamp: string;
  severity: SecuritySeverity;
  type: string;
  source: string;
  ip: string;
  description: string;
  status: SecurityStatus;
}

interface BrokerSummaryRecord {
  ab_number: string;
  logins: number;
  actions: number;
  downloads: number;
  top_tool: string;
  last_activity: string;
}

interface ToolUsageRecord {
  tool: string;
  brokers: number;
  actions: number;
  sessions: number;
  avg: number;
}

interface ExportRecord {
  timestamp: string;
  exported_by: string;
  view: string;
  format: string;
  rows: string;
  status: string;
}

interface ScheduleItem {
  id: number;
  freq: string;
  email: string;
  created: string;
  lastSent: string;
}

interface AuditLogEntry {
  timestamp?: string;
  user_id?: string;
  user_name?: string;
  role?: string;
  status: string;
  reason?: string;
  details?: string;
  email?: string;
  user_agent?: string;
}

interface AppState {
  brokers: BrokersMap;
  activity: ActivityRecord[];
  logins: LoginRecord[];
  downloads: DownloadRecord[];
  security: SecurityRecord[];
  brokerSummary: BrokerSummaryRecord[];
  toolUsage: ToolUsageRecord[];
  exports: ExportRecord[];
  filteredActivity: ActivityRecord[];
  schedules: ScheduleItem[];
  activeSecIndex: number | null;
}

interface ChartValueData {
  d: string;
  v: number;
}

interface ChartNameData {
  name: string;
  v: number;
}

interface ExporterAPI {
  csv: (title: string, headers: string[], rows: (Record<string, any> | string[])[], filename?: string) => boolean;
  excel: (title: string, headers: string[], rows: (Record<string, any> | string[])[], filename?: string) => boolean;
  pdf: (title: string, headers: string[], rows: (Record<string, any> | string[])[], filename?: string) => boolean;
  toast: (msg: string, isSuccess?: boolean) => void;
}

interface Window {
  Exporter?: ExporterAPI;
  renderAllCharts?: (state: AppState) => void;
  setupFilters?: (state: AppState, renderFn: (rows: ActivityRecord[]) => void) => void;
  openSecurityCard?: (index: number) => void;
  triggerSchedEmail?: (idx: number) => void;
  deleteSched?: (idx: number) => void;
  jspdf?: any;
}
