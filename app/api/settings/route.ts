import { handled, ok, parseBody, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { settingsRepo } from "@/lib/db/repos";
import { refreshAllContent } from "@/lib/db/cached";
import { settingsSchema } from "@/lib/validation/schemas";

export async function GET() {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok(await settingsRepo.get());
  });
}

export async function PATCH(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const input = await parseBody(request, settingsSchema);
    const saved = await settingsRepo.save(input);
    refreshAllContent(); // profile info feeds most public pages
    return ok(saved);
  });
}
