import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        customer: {
          primary: "#2563EB",
          secondary: "#64748B",
          accent: "#60A5FA",
        },
        workshop: {
          primary: "#7C3AED",
          secondary: "#64748B",
          accent: "#A78BFA",
        },
        admin: {
          primary: "#DC2626",
          secondary: "#64748B",
          accent: "#F87171",
        },
      },
    },
  },
  plugins: [],
};
export default config;
