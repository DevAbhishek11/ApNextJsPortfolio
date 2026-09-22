import { Counter } from "@/components/animation/counter";
import { RevealGroup } from "@/components/animation/reveal";
import { Container } from "@/components/ui/container";

const stats = [
  { value: 2.5, decimals: 1, suffix: "+", label: "Years Experience" },
  { value: 10, suffix: "+", label: "Projects Delivered" },
  { value: 3, suffix: "", label: "Certifications" },
  { value: 500, suffix: "+", label: "Concurrent Users Supported" },
];

export default function StatsStrip() {
  return (
    <section className="border-y border-border bg-surface py-12 sm:py-14" aria-label="Key stats">
      <Container>
        <RevealGroup className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center lg:text-left">
              <p className="text-4xl font-semibold tracking-tight text-ink sm:text-[2.6rem]">
                <Counter value={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
              </p>
              <p className="mt-1.5 text-[0.83rem] font-medium text-muted">{s.label}</p>
            </div>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
