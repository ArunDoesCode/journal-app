/** @type {import("@serwist/cli").ConfigOptions} */
const config = {
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  globDirectory: ".next",
  globPatterns: ["static/**/*.{js,css}", "server/app/**/*.html"],
}

export default config
