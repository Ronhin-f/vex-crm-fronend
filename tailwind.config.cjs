/** @type {import('tailwindcss').Config} */
const daisyui = require("daisyui");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        vexcrm: {
          primary: "#7e22ce",
          secondary: "#a855f7",
          accent: "#5b21b6",
          neutral: "#3f3f46",
          "base-100": "#f9fafb",
          "base-200": "#f3f4f6",
          "base-300": "#e5e7eb",
          info: "#0ea5e9",
          success: "#22c55e",
          warning: "#facc15",
          error: "#ef4444"
        }
      },
      {
        "vexcrm-dark": {
          primary: "#c084fc",
          secondary: "#a78bfa",
          accent: "#7c3aed",
          neutral: "#a3a3a3",
          "base-100": "#111827",
          "base-200": "#0b1220",
          "base-300": "#030712",
          info: "#38bdf8",
          success: "#34d399",
          warning: "#fbbf24",
          error: "#f87171"
        }
      }
    ]
  }
};
