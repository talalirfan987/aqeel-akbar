import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "balochistan-lottery-dev-secret-change-me"
);
export const CUSTOMER_SESSION_COOKIE = "blm_customer_session";

export interface CustomerSessionPayload {
  customerId: string;
  name: string;
  phone: string;
}

export async function createCustomerSession(payload: CustomerSessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2d")
    .sign(SECRET);
  const store = await cookies();
  store.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 2,
  });
}

export async function destroyCustomerSession() {
  const store = await cookies();
  store.delete(CUSTOMER_SESSION_COOKIE);
}

export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as CustomerSessionPayload;
  } catch {
    return null;
  }
}

export async function verifyCustomerSessionFromToken(token: string): Promise<CustomerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as CustomerSessionPayload;
  } catch {
    return null;
  }
}
