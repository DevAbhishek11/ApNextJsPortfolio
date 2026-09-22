import type { Metadata } from "next";
import {
  AppWindow, Blocks, Cloud, Layers, Radio, Smartphone, TrendingUp,
  type LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/sections/page-header";
import ProcessSteps from "@/components/sections/process-steps";
import CTABanner from "@/components/sections/cta-banner";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/sections/section-heading";
import { RevealGroup } from "@/components/animation/reveal";
import { getSettings } from "@/lib/db/cached";
import { buildMetadata, jsonLdScript, breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings.site, {
    title: "Services",
    description:
      "Full-stack web development, React Native mobile apps, real-time systems, cloud deployment, and UI/UX revamps — scoped by outcome.",
    path: "/services",
  });
}

interface Service {
  title: string;
  description: string;
  includes: string[];
  icon: LucideIcon;
}

const services: Service[] = [
  {
    title: "Full-Stack Web App Development",
    description:
      "Production-grade web applications on the MERN stack or Next.js — from database schema to deployed product.",
    includes: [
      "Next.js with SSR/SSG/ISR for speed & SEO",
      "Node.js/Express or Laravel backends",
      "MongoDB, MySQL or PostgreSQL data layers",
    ],
    icon: Layers,
  },
  {
    title: "Cross-Platform Mobile Apps",
    description:
      "One React Native (Expo) codebase shipping to both app stores — shipped and maintained post-launch above 99.5% uptime.",
    includes: [
      "iOS + Android from a single codebase",
      "Auth flows incl. Twilio OTP / 2FA",
      "Real-time messaging & offline resilience",
    ],
    icon: Smartphone,
  },
  {
    title: "REST API & Backend Architecture",
    description:
      "APIs designed to be fast, documented, and boring to operate — the kind that still make sense at 10k+ requests a month.",
    includes: [
      "REST design with versioning & validation",
      "JWT / OAuth 2.0 auth schemes",
      "MongoDB indexing & query optimization",
    ],
    icon: AppWindow,
  },
  {
    title: "Real-Time Features",
    description:
      "Live chat, notifications, presence, and live tracking over Socket.io/WebSockets — engineered for hundreds of concurrent users.",
    includes: [
      "Bi-directional chat & push notifications",
      "Sub-100ms message latency budgets",
      "Reconnect, resync & scaling strategy",
    ],
    icon: Radio,
  },
  {
    title: "Cloud Deployment & DevOps",
    description:
      "AWS infrastructure you can actually reason about — EC2, S3, Nginx, and CI/CD that ships on every merge.",
    includes: [
      "AWS EC2 + S3 setups with cost control",
      "GitHub Actions CI/CD pipelines",
      "Linux/Nginx hardening & monitoring",
    ],
    icon: Cloud,
  },
  {
    title: "UI/UX Revamp & Performance",
    description:
      "Proof-backed redesigns: my last full revamp drove 40% traffic growth, 60% more page views, and 90% longer sessions.",
    includes: [
      "Design systems with Tailwind tokens",
      "WCAG-compliant, accessible components",
      "Core Web Vitals performance budgets",
    ],
    icon: TrendingUp,
  },
  {
    title: "Third-Party & Payment Integrations",
    description:
      "Knitting external APIs into your product cleanly — payments, comms, AI, and niche industry APIs.",
    includes: [
      "Stripe & Razorpay payment flows",
      "OpenAI API / GPT feature integrations",
      "Twilio, TBO Travel, Airtable & more",
    ],
    icon: Blocks,
  },
];

export default async function ServicesPage() {
  const settings = await getSettings();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Services", url: "/services" },
            ]),
          ),
        }}
      />
      <PageHeader
        eyebrow="Services"
        title="What I can build for you"
        description="Every offering below comes straight from production work — skills proven on live products with real users, not hypothetical capability."
      />

      <Section>
        <Container>
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.title}
                  className="group flex flex-col rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-250 hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover"
                >
                  <div className="mb-4 inline-flex self-start rounded-xl bg-accent-soft p-2.5 text-accent transition-transform duration-200 group-hover:scale-110">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <h2 className="font-semibold tracking-tight text-ink">{service.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{service.description}</p>
                  <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4">
                    {service.includes.map((item) => (
                      <li key={item} className="flex gap-2 text-[0.82rem] leading-relaxed text-muted">
                        <span className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </RevealGroup>
        </Container>
      </Section>

      <Section className="border-t border-border bg-surface-2/40">
        <Container>
          <SectionHeading
            eyebrow="Process"
            title="How we'll work together"
            description="A transparent six-step process refined over 10+ shipped projects — you'll always know what's happening and what's next."
          />
          <ProcessSteps />
        </Container>
      </Section>

      <CTABanner email={settings.profile.email} />
    </>
  );
}
