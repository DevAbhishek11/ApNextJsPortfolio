import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/animation/reveal";

export default function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border pt-24">
      <div className="hero-grid" aria-hidden />
      <div
        aria-hidden
        className="absolute -top-32 right-[-10%] h-72 w-72 rounded-full bg-accent/10 blur-3xl"
      />
      <Container className="relative py-16 sm:py-20">
        <Reveal variant="fade">
          <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.28em] text-accent">
            {eyebrow}
          </p>
        </Reveal>
        <Reveal variant="rise" delay={0.08}>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
        </Reveal>
        {description && (
          <Reveal variant="rise" delay={0.16}>
            <p className="mt-4 max-w-2xl text-[1.06rem] leading-relaxed text-muted">{description}</p>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
