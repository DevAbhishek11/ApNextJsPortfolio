import { z } from "zod";
import { handled, notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { messagesRepo } from "@/lib/db/repos";

const patchSchema = z.object({ read: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const { read } = await parseBody(request, patchSchema);
    const updated = await messagesRepo.setRead(id, read);
    if (!updated) return notFound("Message not found.");
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const removed = await messagesRepo.remove(id);
    if (!removed) return notFound("Message not found.");
    return ok({ deleted: true });
  });
}
