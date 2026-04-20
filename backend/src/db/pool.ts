import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const isInternal = databaseUrl.includes(".internal");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isInternal ? false : { rejectUnauthorized: false },
});

export default pool;