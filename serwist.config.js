/** @type {import("@serwist/cli").ConfigOptions} */
const config = {
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  globDirectory: ".next",
  globPatterns: ["static/**/*.{js,css}"],
  modifyURLPrefix: {
    "static/": "_next/static/",
  },
  additionalPrecacheEntries: [{ url: "/offline", revision: "1" }],
}

export default config
