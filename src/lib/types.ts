export type TicketStatus = "pending" | "verified" | "rejected" | "cancelled";

export interface Draw {
  id: string;
  name: string;
  drawDate: string; // ISO date
  ticketPrice: number;
  active: boolean;
  timerEndMs?: number;
}

export type PaymentMethod = "jazzcash" | "easypaisa";

// When a single submission's tickets are split across multiple people (e.g. someone
// buying 10 tickets divides them as 4 for one person, 2 for another, 4 for a third),
// this records who each portion belongs to. The quantities always sum to the parent
// Ticket's `quantity`.
export interface TicketHolder {
  name: string;
  phone: string;
  quantity: number;
}

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
  holders?: TicketHolder[];
  isWinner?: boolean;
  prize?: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  customerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
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
  type: "submitted" | "verified" | "rejected" | "cancelled" | "message";
  message: string;
  timestamp: string;
  read: boolean;
}

// A manually-announced bulk draw result (e.g. a "Winners List" poster) — independent of
// individual ticket submissions/verification on this platform.
export interface WinnerEntry {
  id: string;
  listTitle: string; // e.g. "Winners List 2"
  listDate: string; // ISO date the list was announced
  srNo: number;
  name: string;
  address: string;
  prize: string; // e.g. "United 125cc", "Axio (Silver)"
  createdAt: string;
}

// A single message in the chat thread attached to a ticket, between the customer and the admin.
export interface TicketMessage {
  id: string;
  ticketId: string;
  referenceId: string;
  sender: "admin" | "customer";
  senderName: string;
  text: string;
  timestamp: string;
}

export interface DbShape {
  draws: Draw[];
  tickets: Ticket[];
  admins: AdminUser[];
  customers: Customer[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  winnerEntries: WinnerEntry[];
  messages: TicketMessage[];
}
