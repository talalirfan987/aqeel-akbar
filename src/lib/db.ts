import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import type { DbShape, Draw, Ticket, AdminUser } from "./types";

const file = path.join(process.cwd(), "src", "data", "db.json");
const adapter = new JSONFile<DbShape>(file);

const defaultData: DbShape = { draws: [], tickets: [], admins: [], customers: [], auditLogs: [], notifications: [] };

let dbInstance: Low<DbShape> | null = null;

function seed(db: Low<DbShape>) {
  const draws: Draw[] = [
    { id: "d1", name: "Balochistan Prize Bond Draw #45", drawDate: "2026-09-15", ticketPrice: 2000, active: true },
    { id: "d2", name: "Balochistan Prize Bond Draw #46", drawDate: "2026-10-15", ticketPrice: 2000, active: true },
    { id: "d3", name: "National Savings Draw #12", drawDate: "2026-08-15", ticketPrice: 1500, active: false },
  ];

  const admins: AdminUser[] = [
    {
      id: "a1",
      username: "admin",
      passwordHash: bcrypt.hashSync("admin123", 10),
      name: "Akeel Akbar",
      role: "super_admin",
    },
  ];

  const now = Date.now();
  const day = 86400000;
  const sampleTickets: Ticket[] = [
    {
      id: nanoid(),
      referenceId: "BLM-2026-000001",
      customerName: "Ahmed Raza",
      phone: "03001234567",
      city: "Quetta",
      ticketNumber: "BL-45001",
      quantity: 1,
      drawId: "d1",
      drawName: draws[0].name,
      amount: 750,
      drawDate: draws[0].drawDate,
      paymentMethod: "jazzcash",
      paymentConfirmed: true,
      status: "verified",
      isDuplicate: false,
      submittedAt: new Date(now - 5 * day).toISOString(),
      verifiedAt: new Date(now - 4 * day).toISOString(),
      verifiedBy: "admin",
      adminNotes: "Receipt clear and matches records.",
    },
    {
      id: nanoid(),
      referenceId: "BLM-2026-000002",
      customerName: "Sana Baloch",
      phone: "03111234567",
      city: "Karachi",
      ticketNumber: "BL-45002",
      quantity: 1,
      drawId: "d1",
      drawName: draws[0].name,
      amount: 750,
      drawDate: draws[0].drawDate,
      paymentMethod: "easypaisa",
      paymentConfirmed: true,
      status: "pending",
      isDuplicate: false,
      submittedAt: new Date(now - 2 * day).toISOString(),
    },
    {
      id: nanoid(),
      referenceId: "BLM-2026-000003",
      customerName: "Bilal Khan",
      phone: "03211234567",
      city: "Lahore",
      ticketNumber: "BL-45003",
      quantity: 1,
      drawId: "d2",
      drawName: draws[1].name,
      amount: 750,
      drawDate: draws[1].drawDate,
      paymentMethod: "jazzcash",
      paymentConfirmed: true,
      status: "rejected",
      isDuplicate: false,
      submittedAt: new Date(now - 1 * day).toISOString(),
      verifiedAt: new Date(now - 0.5 * day).toISOString(),
      verifiedBy: "admin",
      adminNotes: "Receipt image unreadable, please resubmit clearer photo.",
    },
    {
      id: nanoid(),
      referenceId: "BLM-2026-000004",
      customerName: "Ahmed Raza",
      phone: "03001234567",
      city: "Quetta",
      ticketNumber: "BL-45001",
      quantity: 1,
      drawId: "d1",
      drawName: draws[0].name,
      amount: 750,
      drawDate: draws[0].drawDate,
      paymentMethod: "jazzcash",
      paymentConfirmed: true,
      status: "pending",
      isDuplicate: true,
      submittedAt: new Date(now - 0.2 * day).toISOString(),
    },
    {
      id: nanoid(),
      referenceId: "BLM-2026-000005",
      customerName: "Fatima Noor",
      phone: "03451234567",
      city: "Islamabad",
      ticketNumber: "BL-45005",
      quantity: 1,
      drawId: "d2",
      drawName: draws[1].name,
      amount: 750,
      drawDate: draws[1].drawDate,
      paymentMethod: "easypaisa",
      paymentConfirmed: true,
      status: "pending",
      isDuplicate: false,
      submittedAt: new Date(now - 0.05 * day).toISOString(),
    },
  ];

  db.data = { draws, tickets: sampleTickets, admins, customers: [], auditLogs: [], notifications: [] };
}

export async function getDb() {
  if (dbInstance) return dbInstance;
  const db = new Low<DbShape>(adapter, defaultData);
  await db.read();
  if (!db.data || !db.data.tickets || db.data.tickets.length === 0) {
    if (!db.data) db.data = defaultData;
    seed(db);
    await db.write();
  } else if (!db.data.customers) {
    db.data.customers = [];
    await db.write();
  }
  dbInstance = db;
  return db;
}

export function nextReferenceId(existing: Ticket[]): string {
  const year = new Date().getFullYear();
  const max = existing
    .map((t) => t.referenceId)
    .filter((r) => r.startsWith(`BLM-${year}-`))
    .map((r) => parseInt(r.split("-")[2], 10))
    .reduce((a, b) => Math.max(a, b), 0);
  const next = (max + 1).toString().padStart(6, "0");
  return `BLM-${year}-${next}`;
}
