export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  ssr: false,
  devtools: { enabled: false },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/css/main.css"],
  typescript: {
    strict: true
  },
  app: {
    head: {
      title: "Hourwise - daily time tracking",
      htmlAttrs: { lang: "en", "data-theme": "light" }
    }
  }
});
