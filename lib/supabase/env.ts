/**
 * Reads a required environment variable and throws a clear, named error if
 * it is missing or empty. Call this from inside a client-creation function
 * (never at module scope) so a missing var fails loudly at the point of use
 * instead of crashing the whole route/build silently.
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}
