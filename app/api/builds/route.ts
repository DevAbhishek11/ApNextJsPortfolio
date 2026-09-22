import { handled, ok, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { buildsRepo } from "@/lib/db/repos";

export async function GET() {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok(await buildsRepo.all());
  });
}
