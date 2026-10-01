"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { contactSchema, type ContactInput } from "@/lib/validation/schemas";
import type { ApiResponse } from "@/lib/types";

// Override the shared 14px field size only here: iOS zooms focused fields below 16px.
const contactFieldClassName = "min-w-0 text-base!";

export default function ContactForm() {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });

  const onSubmit = async (values: ContactInput) => {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as ApiResponse<{ id: string }>;
      if (!res.ok || !json.success) {
        toast.error(json.success ? "Something went wrong." : json.error.message);
        return;
      }
      setDone(true);
      reset();
      toast.success("Message sent — I'll get back to you soon.");
    } catch {
      toast.error("Network error — please try again in a moment.");
    }
  };

  if (done) {
    return (
      <div className="rounded-card border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-lg font-semibold text-emerald-800">Message received</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-emerald-700">
          Thanks for reaching out — I usually reply within one business day. Feel free to send
          another message anytime.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-5 text-sm font-semibold text-emerald-800 underline underline-offset-4 hover:no-underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative min-w-0 space-y-5">
      {/* Honeypot — invisible to humans, irresistible to bots */}
      <div aria-hidden className="sr-only">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Name" required error={errors.name?.message} htmlFor="cf-name">
          <Input
            id="cf-name"
            className={contactFieldClassName}
            invalid={!!errors.name}
            placeholder="Your name"
            {...register("name")}
          />
        </Field>
        <Field label="Email" required error={errors.email?.message} htmlFor="cf-email">
          <Input
            id="cf-email"
            className={contactFieldClassName}
            type="email"
            invalid={!!errors.email}
            placeholder="you@company.com"
            {...register("email")}
          />
        </Field>
      </div>
      <Field label="Subject" required error={errors.subject?.message} htmlFor="cf-subject">
        <Input
          id="cf-subject"
          className={contactFieldClassName}
          invalid={!!errors.subject}
          placeholder="What's this about?"
          {...register("subject")}
        />
      </Field>
      <Field
        label="Message"
        required
        error={errors.message?.message}
        hint="Project scope, timelines, and links all help — but write as much or as little as you like."
        htmlFor="cf-message"
      >
        <Textarea
          id="cf-message"
          className={contactFieldClassName}
          rows={7}
          invalid={!!errors.message}
          placeholder="Tell me about your project, question, or opportunity…"
          {...register("message")}
        />
      </Field>
      <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto" size="lg">
        {isSubmitting ? "Sending…" : "Send message"} <Send size={15} />
      </Button>
    </form>
  );
}
