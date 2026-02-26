/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "primary-fixed": "#d7e2ff",
        "on-primary-container": "#cbdbff",
        "inverse-on-surface": "#f0f0f7",
        "on-background": "#191c21",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#a1e5ff",
        "secondary-fixed": "#d7e3f8",
        "surface-tint": "#255dad",
        "on-secondary-container": "#596576",
        "on-error": "#ffffff",
        "surface-container-highest": "#e1e2e9",
        "outline-variant": "#c2c6d4",
        "on-tertiary-fixed-variant": "#004e60",
        "background": "#f9f9ff",
        "surface-container-high": "#e7e8ef",
        "error-container": "#ffdad6",
        "surface-bright": "#f9f9ff",
        "surface": "#f9f9ff",
        "on-primary-fixed": "#001b3f",
        "tertiary-container": "#006981",
        "surface-container-lowest": "#ffffff",
        "on-primary-fixed-variant": "#00458f",
        "tertiary": "#004f62",
        "secondary-fixed-dim": "#bbc7db",
        "on-secondary": "#ffffff",
        "on-secondary-fixed-variant": "#3c4858",
        "surface-dim": "#d9dae1",
        "surface-container": "#ededf4",
        "on-error-container": "#93000a",
        "on-secondary-fixed": "#101c2b",
        "secondary": "#535f70",
        "surface-container-low": "#f3f3fa",
        "inverse-surface": "#2e3036",
        "primary-container": "#275fae",
        "on-surface-variant": "#424752",
        "inverse-primary": "#abc7ff",
        "error": "#ba1a1a",
        "primary": "#004692",
        "on-primary": "#ffffff",
        "outline": "#727783",
        "on-tertiary-fixed": "#001f28",
        "on-surface": "#191c21",
        "secondary-container": "#d7e3f8",
        "tertiary-fixed-dim": "#4cd6ff",
        "surface-variant": "#e1e2e9",
        "primary-fixed-dim": "#abc7ff",
        "tertiary-fixed": "#b7eaff"
      },
      fontFamily: {
        headline: ["Manrope"],
        body: ["Inter"]
      }
    }
  },
  plugins: []
}