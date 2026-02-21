import { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./prisma";
import { Agent } from "@/generated/prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-in-production"
);

// ─── Agent Authentication ─────────────────────────────────────────────────────

export async function authenticateAgent(
  req: NextRequest
): Promise<{ agent: Agent | null; error: string | null }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      agent: null,
      error: "Missing or malformed Authorization header. Use: Bearer <api_key>",
    };
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    return { agent: null, error: "Empty API key" };
  }

  const agent = await prisma.agent.findUnique({
    where: { apiKey: rawKey },
  });

  if (!agent) {
    return { agent: null, error: "Invalid API key" };
  }

  return { agent, error: null };
}

// ─── Admin Authentication ─────────────────────────────────────────────────────

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(
  token: string
): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function verifyAdminCookie(
  req: NextRequest
): Promise<boolean> {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}
