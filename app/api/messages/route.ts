import { handled, ok, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { messagesRepo } from "@/lib/db/repos";

export async function GET() {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const items = await messagesRepo.all();
    return ok({ items, unread: items.filter((m) => !m.read).length });
  });
}
