import type { Settings } from "@/lib/types";

// Used if data/settings.json is missing/corrupt — keeps the site renderable.
export const fallbackSettings: Settings = {
  site: {
    name: "Abhishek Prajapati",
    titleTemplate: "%s | Abhishek Prajapati — Full Stack Developer",
    defaultDescription:
      "Full Stack Developer with 2.5+ years of production experience building scalable web and mobile applications with the MERN stack, Next.js, and React Native.",
    defaultOgImage: "/seed/og-default.jpg",
    analyticsId: "",
    searchConsoleId: "",
  },
  profile: {
    name: "Abhishek Prajapati",
    role: "Full Stack Developer",
    tagline: "MERN Stack · Next.js · React Native",
    roles: ["Full Stack Developer", "MERN Stack Developer", "React Native Developer"],
    bio: "Full Stack Developer with 2.5+ years of production experience building scalable web and mobile applications using the MERN stack, Next.js, and React Native.",
    avatar: "/seed/avatar.jpg",
    email: "dev.abhishek.ap11@gmail.com",
    phone: "+91 705-629-8363",
    location: "Shahabad Markanda, Haryana, India",
    availability: "Open to freelance & full-time opportunities",
    resumeUrl: "/resume.pdf",
    socials: {
      github: "https://github.com/DevAbhishek11",
      linkedin: "https://www.linkedin.com/in/ap-abhishek",
      twitter: "",
      email: "mailto:dev.abhishek.ap11@gmail.com",
    },
    languages: ["English (Professional)", "Hindi (Native)"],
    interests: ["Open source", "UI/UX design", "Tech blogging", "AI/ML integrations"],
  },
  theme: { adminDefault: "dark" },
};
