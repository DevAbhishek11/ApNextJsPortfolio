import { cn } from "@/lib/utils";
import { Reveal } from "@/components/animation/reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-12 sm:mb-16",
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className,
      )}
    >
      <Reveal variant="fade">
        <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.28em] text-accent">
          {eyebrow}
        </p>
      </Reveal>
      <Reveal variant="rise" delay={0.08}>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.6rem] lg:leading-[1.12]">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal variant="rise" delay={0.16}>
          <p
            className={cn(
              "mt-4 text-[1.02rem] leading-relaxed text-muted",
              align === "center" && "mx-auto max-w-xl",
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
