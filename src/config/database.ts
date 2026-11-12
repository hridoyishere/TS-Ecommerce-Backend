import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

db.on("error", (error: Error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export default db;