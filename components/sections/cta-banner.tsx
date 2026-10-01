import { ArrowRight, Mail } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Reveal } from "@/components/animation/reveal";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CTABanner({
  email,
  wrapEmail = false,
}: {
  email: string;
  // Opt in on Home/About only; keep other pages' existing CTA presentation.
  wrapEmail?: boolean;
}) {
  return (
    <Section>
      <Container>
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-[#101014] px-6 py-16 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(40% 60% at 20% 20%, rgba(99,102,241,0.35), transparent 70%), radial-gradient(35% 55% at 85% 80%, rgba(20,184,166,0.22), transparent 70%)",
              }}
            />
            <div className="relative">
              <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.28em] text-white/60">
                Have a project in mind?
              </p>
              <h2 className="mx-auto mt-4 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Let&apos;s build something great together
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[1.02rem] leading-relaxed text-white/65">
                Whether it&apos;s a product that needs shipping or a system that needs scaling — I&apos;m
                one message away.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink href="/contact" size="lg">
                  Start a conversation <ArrowRight size={16} />
                </ButtonLink>
                <a
                  href={`mailto:${email}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-control border border-white/25 text-[0.95rem] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/50",
                    wrapEmail
                      ? "min-h-12 max-w-full justify-center px-4 py-3 sm:px-6"
                      : "h-12 px-6",
                  )}
                >
                  <Mail size={16} className={wrapEmail ? "shrink-0" : undefined} />
                  {wrapEmail ? <span className="min-w-0 [overflow-wrap:anywhere]">{email}</span> : email}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
