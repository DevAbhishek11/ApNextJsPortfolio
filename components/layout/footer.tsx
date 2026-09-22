import Link from "next/link";
import { ArrowUp, Mail, MapPin } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { Container } from "@/components/ui/container";
import type { ProfileSettings } from "@/lib/types";

const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Footer({ profile }: { profile: ProfileSettings }) {
  const year = new Date().getFullYear();
  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[0.82rem] font-bold text-accent-ink">
                {initials}
              </span>
              <span className="font-semibold tracking-tight">{profile.name}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {profile.role} building scalable web & mobile products — MERN, Next.js, and React
              Native, from first commit to production.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {profile.socials.github && (
                <a
                  href={profile.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub profile"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                >
                  <GithubIcon size={16} />
                </a>
              )}
              {profile.socials.linkedin && (
                <a
                  href={profile.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn profile"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                >
                  <LinkedinIcon size={16} />
                </a>
              )}
              <a
                href={`mailto:${profile.email}`}
                aria-label="Send email"
                className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          <nav aria-label="Footer">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Sitemap</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {nav.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted transition-colors duration-150 hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              Get in touch
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-start gap-2 transition-colors hover:text-accent"
                >
                  <Mail size={15} className="mt-0.5 shrink-0" />
                  <span className="break-all">{profile.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0" /> {profile.location}
              </li>
            </ul>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
            >
              Send a message →
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-faint">
            © {year} {profile.name}. Built with Next.js, Tailwind CSS & GSAP.
          </p>
          <a
            href="#top"
            aria-label="Back to top"
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:text-accent"
          >
            <ArrowUp size={16} />
          </a>
        </div>
      </Container>
    </footer>
  );
}
