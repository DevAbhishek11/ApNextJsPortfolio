import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import type { ApiFailure } from "@/lib/types";

// ---------------------------------------------------------------------------
// Consistent API envelope:
//   success: { success: true, data }
//   failure: { success: false, error: { code, message, fields? } }
// ---------------------------------------------------------------------------

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): NextResponse<ApiFailure> {
  return NextResponse.json(
    { success: false, error: { code, message, ...(fields ? { fields } : {}) } },
    { status },
  );
}

export function badRequest(message = "Invalid request.", fields?: Record<string, string>) {
  return fail(400, "VALIDATION_ERROR", message, fields);
}

export function unauthorized(message = "Authentication required.") {
  return fail(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "You do not have permission to perform this action.") {
  return fail(403, "FORBIDDEN", message);
}

export function notFound(message = "The requested resource was not found.") {
  return fail(404, "NOT_FOUND", message);
}

export function payloadTooLarge(message = "The uploaded payload is too large.") {
  return fail(413, "PAYLOAD_TOO_LARGE", message);
}

export function tooManyRequests(message = "Too many requests — please slow down and retry.") {
  return fail(429, "RATE_LIMITED", message);
}

export function serverError(message = "Something went wrong on our side. Please try again.") {
  return fail(500, "INTERNAL_ERROR", message);
}

/** Parse a JSON body against a Zod schema; returns data or throws ApiHandledError. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiHandledError(badRequest("Request body must be valid JSON."));
  }
  try {
    return schema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      const fields: Record<string, string> = {};
      for (const issue of err.issues) {
        const key = issue.path.join(".") || "_";
        if (!fields[key]) fields[key] = issue.message;
      }
      throw new ApiHandledError(badRequest("Please fix the highlighted fields.", fields));
    }
    throw err;
  }
}

/** Wraps a route handler: ApiHandledError → its response; everything else → 500. */
export async function handled(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiHandledError) return err.response;
    console.error("[api] unexpected error:", err);
    return serverError();
  }
}

export class ApiHandledError extends Error {
  constructor(public response: NextResponse) {
    super("handled");
  }
}
