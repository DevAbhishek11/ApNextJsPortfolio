import { handled, ok, parseBody, tooManyRequests } from "@/lib/api";
import { messagesRepo } from "@/lib/db/repos";
import { notifyContactMessage } from "@/lib/email";
import { clientIp, rateLimit, sweep } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation/schemas";
import { uid } from "@/lib/utils";
import type { Message } from "@/lib/types";

// POST /api/contact — public. Honeypot + per-IP rate limit; saves to
// messages.json and optionally emails the owner when SMTP is configured.
export async function POST(request: Request) {
  return handled(async () => {
    sweep(60_000);
    const ip = clientIp(request);
    const limit = rateLimit(`contact:${ip}`, 5, 60 * 60_000); // 5/hour/IP
    if (!limit.ok) {
      return tooManyRequests(
        `You've sent several messages recently. Please try again in ~${Math.ceil(limit.retryAfterSeconds / 60)} min.`,
      );
    }

    const input = await parseBody(request, contactSchema);

    // Honeypot filled → behaves like success, stores nothing.
    if (input.website) {
      return ok({ id: "ok" }, { status: 201 });
    }

    const message: Message = {
      id: uid("msg"),
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await messagesRepo.add(message);
    await notifyContactMessage(input); // no-op unless SMTP configured

    return ok({ id: message.id }, { status: 201 });
  });
}
