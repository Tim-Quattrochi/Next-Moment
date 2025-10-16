import { neon } from "@neondatabase/serverless"

// Create a singleton SQL client
const sql = neon(process.env.DATABASE_URL!)

export { sql }
