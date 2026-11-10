import { neon } from "@neondatabase/serverless"

/**
 * Create a singleton SQL client.
 * During builds (when DATABASE_URL may be unset), export a lazy-throwing proxy
 * to avoid crashing at import time. Any actual DB usage without a URL will
 * throw a clear error at call time instead.
 */
const DATABASE_URL = process.env.DATABASE_URL

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sql: any = DATABASE_URL
  ? neon(DATABASE_URL)
  : new Proxy(() => undefined, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apply() {
        throw new Error("DATABASE_URL is not set. Cannot execute SQL query.")
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get() {
        throw new Error("DATABASE_URL is not set. SQL client is unavailable.")
      },
    })

export { sql }
