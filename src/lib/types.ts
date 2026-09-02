export type TicketStatus = "pending" | "verified" | "rejected" | "cancelled";

export interface Draw {
  id: string;
  name: string;
  drawDate: string; // ISO date
  ticketPrice: number;
  active: boolean;
}

export type PaymentMethod = "jazzcash" | "easypaisa";

export interface Ticket {
  id: string;
  referenceId: string;
  customerName: string;
  phone: string;
  city: string;
  cnic?: string;
  ticketNumber: string;
  quantity: number;
  drawId: string;
  drawName: string;
  amount: number;
  drawDate: string;
  paymentMethod: PaymentMethod;
  paymentConfirmed: boolean;
  ticketImage?: string; // data URL
  ticketImageName?: string;
  status: TicketStatus;
  adminNotes?: string;
  isDuplicate: boolean;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: "super_admin" | "operator";
}

export interface AuditLog {
  id: string;
  adminUsername: string;
  action: string;
  referenceId?: string;
  previousStatus?: string;
  newStatus?: string;
  timestamp: string;
  details?: string;
}

export interface Notification {
  id: string;
  referenceId: string;
  type: "submitted" | "verified" | "rejected" | "cancelled";
  message: string;
  timestamp: string;
  read: boolean;
}

export interface DbShape {
  draws: Draw[];
  tickets: Ticket[];
  admins: AdminUser[];
  auditLogs: AuditLog[];
  notifications: Notification[];
}
