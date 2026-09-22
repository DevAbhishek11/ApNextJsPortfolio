import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import PageHeader from "@/components/sections/page-header";
import ContactForm from "@/components/sections/contact-form";
import { Container, Section } from "@/components/ui/container";
import { Reveal } from "@/components/animation/reveal";
import { getSettings } from "@/lib/db/cached";
import { buildMetadata, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings.site, {
    title: "Contact",
    description:
      "Get in touch about projects, roles, or collaborations — based in Haryana, India, working with teams everywhere.",
    path: "/contact",
  });
}

export default async function ContactPage() {
  const settings = await getSettings();
  const { profile } = settings;

  const cards = [
    {
      icon: Mail,
      label: "Email",
      value: profile.email,
      href: `mailto:${profile.email}`,
    },
    { icon: Phone, label: "Phone", value: profile.phone, href: `tel:${profile.phone.replace(/\s/g, "")}` },
    { icon: MapPin, label: "Location", value: profile.location },
    { icon: Clock, label: "Availability", value: profile.availability },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Contact", url: "/contact" },
            ]),
          ),
        }}
      />
      <PageHeader
        eyebrow="Contact"
        title="Let's talk about your project"
        description="Whether it's a full product build, a hard real-time problem, or a role you're hiring for — my inbox is open."
      />
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[400px_1fr] lg:gap-14">
            <div>
              <Reveal variant="rise">
                <h2 className="text-xl font-semibold tracking-tight text-ink">
                  Prefer a direct line?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Reach me through any of these — email gets the fastest response.
                </p>
              </Reveal>
              <div className="mt-6 space-y-3">
                {cards.map((card, i) => {
                  const Icon = card.icon;
                  const inner = (
                    <>
                      <div className="rounded-xl bg-accent-soft p-2.5 text-accent">
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-faint">{card.label}</p>
                        <p className="truncate text-sm font-semibold text-ink">{card.value}</p>
                      </div>
                    </>
                  );
                  return (
                    <Reveal key={card.label} variant="left" delay={0.06 * i}>
                      {card.href ? (
                        <a
                          href={card.href}
                          className="flex items-center gap-3.5 rounded-card border border-border bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover"
                        >
                          {inner}
                        </a>
                      ) : (
                        <div className="flex items-center gap-3.5 rounded-card border border-border bg-surface p-4 shadow-card">
                          {inner}
                        </div>
                      )}
                    </Reveal>
                  );
                })}
              </div>

              <Reveal variant="rise" delay={0.2}>
                <div className="mt-6 rounded-card border border-accent/20 bg-accent-soft p-5">
                  <p className="text-sm font-semibold text-ink">Let&apos;s connect</p>
                  <p className="mt-1 text-[0.84rem] leading-relaxed text-muted">
                    I&apos;m most active on LinkedIn and GitHub — code speaks louder than bios.
                  </p>
                  <div className="mt-3.5 flex gap-2">
                    {profile.socials.linkedin && (
                      <a
                        href={profile.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-control bg-accent px-3.5 py-2 text-xs font-semibold text-accent-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
                      >
                        <LinkedinIcon size={13} /> LinkedIn
                      </a>
                    )}
                    {profile.socials.github && (
                      <a
                        href={profile.socials.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <GithubIcon size={13} /> GitHub
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal variant="right" delay={0.1}>
              <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
                <h2 className="text-xl font-semibold tracking-tight text-ink">Send a message</h2>
                <p className="mt-2 text-sm text-muted">
                  Typical response time: within one business day, IST.
                </p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
