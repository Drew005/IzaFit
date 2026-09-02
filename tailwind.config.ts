import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#111318", // fundo principal
          raised: "#181B21", // cards / superfícies elevadas
          line: "#262A32", // bordas/divisores
        },
        ink: {
          DEFAULT: "#EDEEF0", // texto principal
          soft: "#9A9FAA", // texto secundário
        },
        volt: {
          DEFAULT: "#FF4D8E", // acento primário — energia, ação
          dim: "#D6336C",
        },
        moss: {
          DEFAULT: "#623E59", // acento secundário — sóbrio, financeiro
          light: "#8A5C7C",
        },
        alert: {
          DEFAULT: "#FF6B5E", // estoque baixo / negativo
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
