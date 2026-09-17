import { neon } from "@neondatabase/serverless";
import { setDefaultResultOrder } from "dns";
import dns from "dns";
import { Agent, setGlobalDispatcher } from "undici";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import type { DbShape, Draw, Ticket, AdminUser, WinnerEntry } from "./types";

// Force IPv4 first so connections don't hang on unreachable IPv6 routes.
setDefaultResultOrder("ipv4first");
try {
  setGlobalDispatcher(
    new Agent({
      connect: {
        lookup: (hostname, opts, cb) => {
          dns.lookup(hostname, { ...opts, family: 4 }, cb);
        },
      },
    })
  );
} catch {
  // Ignored if dispatcher already registered
}

const sql = neon(process.env.DATABASE_URL!);
const ROW_ID = "main";

let schemaReady: Promise<void> | null = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS app_state (
        id text PRIMARY KEY,
        data jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `.then(() => undefined);
  }
  return schemaReady;
}

// In-memory cache to eliminate remote database roundtrips on repeated reads
let cachedData: DbShape | null = null;
let cachedAt = 0;
let inFlightRead: Promise<DbShape> | null = null;
const CACHE_TTL_MS = 5000; // 5 seconds in-memory cache

class PgStore {
  data: DbShape | null = null;

  async read(force = false) {
    const now = Date.now();
    if (!force && cachedData && now - cachedAt < CACHE_TTL_MS) {
      this.data = cachedData;
      return;
    }

    if (inFlightRead) {
      this.data = await inFlightRead;
      return;
    }

    inFlightRead = (async () => {
      await ensureSchema();
      const rows = await sql`SELECT data FROM app_state WHERE id = ${ROW_ID}`;
      let loaded: DbShape;
      if (rows.length === 0) {
        seed(this);
        await sql`
          INSERT INTO app_state (id, data) VALUES (${ROW_ID}, ${JSON.stringify(this.data)}::jsonb)
          ON CONFLICT (id) DO NOTHING
        `;
        const [row] = await sql`SELECT data FROM app_state WHERE id = ${ROW_ID}`;
        loaded = row.data as DbShape;
      } else {
        loaded = rows[0].data as DbShape;
      }
      cachedData = loaded;
      cachedAt = Date.now();
      return loaded;
    })();

    try {
      this.data = await inFlightRead;
    } finally {
      inFlightRead = null;
    }
  }

  async write() {
    cachedData = this.data;
    cachedAt = Date.now();
    await sql`
      UPDATE app_state SET data = ${JSON.stringify(this.data)}::jsonb, updated_at = now()
      WHERE id = ${ROW_ID}
    `;
  }
}

const defaultData: DbShape = {
  draws: [],
  tickets: [],
  admins: [],
  customers: [],
  auditLogs: [],
  notifications: [],
  winnerEntries: [],
  messages: [],
};

function seed(db: PgStore) {
  const draws: Draw[] = [
    { id: "d1", name: "Lucky Lottery Prize Bond Draw #45", drawDate: "2026-09-15", ticketPrice: 2000, active: true },
    { id: "d2", name: "Lucky Lottery Prize Bond Draw #46", drawDate: "2026-10-15", ticketPrice: 2000, active: true },
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

  const winnerListDate = "2026-06-15";
  const winnerRows: [number, string, string, string][] = [
    [26, "Mehrullah Dasht", "Dasht", "United 125cc"],
    [27, "145", "Gwadar", "United 125cc"],
    [28, "BAba Jan", "Panjgur", "United 125cc"],
    [29, "Nazer", "Panjgur", "United 125cc"],
    [30, "Adres", "Sengani Sar", "United 125cc"],
    [31, "Madihak", "Malik Abad Tr.", "United 125cc"],
    [32, "Kizar", "Gwadar", "United 125cc"],
    [33, "Shahed", "Zamuran", "United 125cc"],
    [34, "Dedar Panjgur", "Panjgur", "United 125cc"],
    [35, "Yaaro", "Bulaida", "United 125cc"],
    [36, "Fatima", "Gwadar", "United 125cc"],
    [37, "Makkahe Maath", "Karachi Liyari", "United 125cc"],
    [38, "Sajid Karachi", "Karachi", "United 125cc"],
    [39, "313", "Panjgur", "United 125cc"],
    [40, "BAba Jan", "Panjgur", "United 125cc"],
    [41, "Mohammad Naseem", "Turbat", "Axio (Silver)"],
    [42, "Bebok Baloch", "Panjgur", "Premio (White)"],
    [43, "Ustad Ilahibaksh", "Kappar", "Axio (Golden)"],
    [44, "Bismillah", "Turbat Jusak", "Prado (3 Door)"],
    [45, "Shetan Khan", "Ormara", "Axio (Silver)"],
    [46, "Maryam", "Mand", "Axio (Surmgi)"],
    [47, "Sotkage Arman", "Panwan", "Toyota (Altis)"],
    [48, "Ayan", "Jewani", "Revo (G-R)"],
    [49, "Shambu", "Pasni", "Double Door (2700)"],
    [50, "Mr. Bean", "Jamak Balnigwar", "Prado (5 Door)"],
  ];
  const winnerEntries: WinnerEntry[] = winnerRows.map(([srNo, name, address, prize]) => ({
    id: nanoid(),
    listTitle: "Winners List 2",
    listDate: winnerListDate,
    srNo,
    name,
    address,
    prize,
    createdAt: new Date(now - 60 * day).toISOString(),
  }));

  db.data = {
    draws,
    tickets: sampleTickets,
    admins,
    customers: [],
    auditLogs: [],
    notifications: [],
    winnerEntries,
    messages: [],
  };
}

export async function getDb() {
  const db = new PgStore();
  await db.read();
  if (!db.data) db.data = defaultData;

  // Backfill collections added after some rows were already seeded, same as before.
  let dirty = false;
  if (!db.data.customers) {
    db.data.customers = [];
    dirty = true;
  }
  if (!db.data.winnerEntries) {
    db.data.winnerEntries = [];
    dirty = true;
  }
  if (!db.data.messages) {
    db.data.messages = [];
    dirty = true;
  }
  if (dirty) await db.write();

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
