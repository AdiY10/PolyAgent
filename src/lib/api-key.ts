import { randomBytes } from "crypto";

export function generateApiKey(): string {
  return `pa_${randomBytes(32).toString("hex")}`;
}
