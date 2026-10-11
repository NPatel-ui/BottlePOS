// ─── Backend Type Mapping ───────────────────────────────────────────
// 1:1 TypeScript interfaces derived from app/schemas and app/domain

export interface Product {
  id: string;
  organization_id: string;
  store_id: string;
  sku: string;
  name: string;
  category: string;
  bottle_price: number;
  cost: number;
  barcode?: string;
  brand?: string;
  subcategory?: string;
  description?: string;
  size?: string;
  unit?: string;
  case_price?: number;
  pack_price?: number;
  tax_category?: string;
  alcohol_category?: string;
  active_status: boolean;
  age_restricted: boolean;
  reorder_threshold: number;
  preferred_vendor_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
}

// ─── Transactions ───────────────────────────────────────────────────

export const TransactionStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  ON_HOLD: "ON_HOLD",
  VOIDED: "VOIDED",
  REFUNDED: "REFUNDED",
} as const;
export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

export const ItemType = {
  BOTTLE: "BOTTLE",
  PACK: "PACK",
  CASE: "CASE",
} as const;
export type ItemType = typeof ItemType[keyof typeof ItemType];

export interface TransactionItem {
  id: string;
  product_id: string;
  product_name: string;
  item_type: ItemType;
  quantity: number;
  unit_price: number;
  original_price?: number;
  discount_amount: number;
  discount_reason?: string;
  tax_amount: number;
  is_voided: boolean;
  is_refunded: boolean;
}

export interface Transaction {
  id: string;
  organization_id: string;
  store_id: string;
  employee_id: string;
  shift_id: string;
  customer_id?: string;
  status: TransactionStatus;
  items: TransactionItem[];
  subtotal: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  amount_paid: number;
  change_due: number;
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
  void_reason?: string;
}

// ─── Shield AI ──────────────────────────────────────────────────────

export const AlertSeverity = {
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity];

export const AlertStatus = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;
export type AlertStatus = typeof AlertStatus[keyof typeof AlertStatus];

export const InvestigationOutcome = {
  LEGITIMATE: "LEGITIMATE",
  OPERATIONAL_ERROR: "OPERATIONAL_ERROR",
  PROCESS_ISSUE: "PROCESS_ISSUE",
  SUPPLIER_ISSUE: "SUPPLIER_ISSUE",
  INTERNAL_LOSS: "INTERNAL_LOSS",
  UNKNOWN: "UNKNOWN",
} as const;
export type InvestigationOutcome = typeof InvestigationOutcome[keyof typeof InvestigationOutcome];

export interface ShieldAlert {
  id: string;
  organization_id: string;
  store_id: string;
  alert_type: string;
  title: string;
  description: string;
  risk_score: number;
  severity: AlertSeverity;
  employee_id?: string;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
  reasons: string[];
  related_events: string[];
  related_transactions: string[];
  potential_exposure: number;
}

// ─── Audit ──────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  organization_id: string;
  store_id: string;
  employee_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  request_id?: string;
  created_at: string;
}
