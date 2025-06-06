import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.foreground / 1"),
            "--tw-prose-headings": theme("colors.foreground / 1"),
            "--tw-prose-lead": theme("colors.foreground / 1"),
            "--tw-prose-links": theme("colors.primary.DEFAULT / 1"),
            "--tw-prose-bold": theme("colors.foreground / 1"),
            "--tw-prose-counters": theme("colors.muted.foreground / 1"),
            "--tw-prose-bullets": theme("colors.muted.foreground / 1"),
            "--tw-prose-hr": theme("colors.border / 1"),
            "--tw-prose-quotes": theme("colors.foreground / 1"),
            "--tw-prose-quote-borders": theme("colors.border / 1"),
            "--tw-prose-captions": theme("colors.muted.foreground / 1"),
            "--tw-prose-code": theme("colors.foreground / 1"),
            "--tw-prose-pre-code": theme("colors.foreground / 1"),
            "--tw-prose-pre-bg": theme("colors.muted.DEFAULT / 1"),
            "--tw-prose-th-borders": theme("colors.border / 1"),
            "--tw-prose-td-borders": theme("colors.border / 1"),
            h1: {
              fontSize: theme("fontSize.3xl"),
              fontWeight: "700",
              marginTop: theme("spacing.6"),
              marginBottom: theme("spacing.4"),
            },
            h2: {
              fontSize: theme("fontSize.2xl"),
              fontWeight: "700",
              marginTop: theme("spacing.5"),
              marginBottom: theme("spacing.3"),
            },
            h3: {
              fontSize: theme("fontSize.xl"),
              fontWeight: "600",
              marginTop: theme("spacing.4"),
              marginBottom: theme("spacing.2"),
            },
            h4: {
              fontSize: theme("fontSize.lg"),
              fontWeight: "600",
              marginTop: theme("spacing.4"),
              marginBottom: theme("spacing.2"),
            },
            p: {
              marginTop: theme("spacing.3"),
              marginBottom: theme("spacing.3"),
            },
            table: {
              width: "100%",
              marginTop: theme("spacing.6"),
              marginBottom: theme("spacing.6"),
              borderCollapse: "collapse",
            },
            thead: {
              borderBottomWidth: "1px",
              borderBottomColor: "var(--tw-prose-th-borders)",
            },
            "thead th": {
              padding: theme("spacing.2"),
              fontWeight: "600",
              textAlign: "left",
              verticalAlign: "bottom",
            },
            "tbody tr": {
              borderBottomWidth: "1px",
              borderBottomColor: "var(--tw-prose-td-borders)",
            },
            "tbody td": {
              padding: theme("spacing.2"),
              verticalAlign: "top",
            },
          },
        },
        invert: {
          css: {
            "--tw-prose-body": theme("colors.foreground / 1"),
            "--tw-prose-headings": theme("colors.foreground / 1"),
            "--tw-prose-links": theme("colors.primary.DEFAULT / 1"),
            "--tw-prose-bold": theme("colors.foreground / 1"),
            "--tw-prose-pre-bg": theme("colors.muted.DEFAULT / 0.5"),
            "--tw-prose-th-borders": theme("colors.border / 0.5"),
            "--tw-prose-td-borders": theme("colors.border / 0.3"),
          },
        },
      }),
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
