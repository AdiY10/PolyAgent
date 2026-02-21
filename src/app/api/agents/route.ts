import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-key";

const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_\-. ]+$/, "Name contains invalid characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? parsed.error.message },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    const existing = await prisma.agent.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "Agent name already taken" },
        { status: 409 }
      );
    }

    const apiKey = generateApiKey();

    const agent = await prisma.agent.create({
      data: { name, apiKey },
      select: { id: true, name: true, balance: true, createdAt: true },
    });

    return NextResponse.json(
      {
        agent,
        apiKey,
        message:
          "Save your API key — it will not be shown again. Use it as: Authorization: Bearer <apiKey>",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
