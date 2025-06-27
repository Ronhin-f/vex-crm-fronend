/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7e22ce",      // Violeta Vector Inc
        secondary: "#a855f7",    // Lilac fuerte
        info: "#0ea5e9",
        warning: "#facc15",
        success: "#22c55e",
        neutral: "#64748b",
      },
    },
  },
  plugins: [
    require("daisyui") // solo si usás DaisyUI
  ],
  daisyui: {
    themes: [
      {
        vexcrm: {
          primary: "#7e22ce",
          secondary: "#a855f7",
          accent: "#5b21b6",
          neutral: "#3f3f46",
          "base-100": "#f9fafb",
          info: "#0ea5e9",
          success: "#22c55e",
          warning: "#facc15",
          error: "#ef4444",
        },
      },
    ],
    theme: "vexcrm"
  },
}
