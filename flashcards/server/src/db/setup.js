import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const dir = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Copy .env.example to .env first.');
  process.exit(1);
}

const url = new URL(process.env.DATABASE_URL);
const dbName = decodeURIComponent(url.pathname.slice(1));
if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
  console.error('Database name may only contain letters, numbers and underscores.');
  process.exit(1);
}

// Connect to the default "postgres" database to create ours if it is missing.
const adminUrl = new URL(process.env.DATABASE_URL);
adminUrl.pathname = '/postgres';
const admin = new pg.Client({ connectionString: adminUrl.toString() });

try {
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (rowCount) {
    console.log(`Database "${dbName}" already exists.`);
  } else {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database "${dbName}".`);
  }
} catch (err) {
  console.error('Could not reach PostgreSQL:', err.message);
  console.error('Check that PostgreSQL is running and the password in server/.env is correct.');
  process.exit(1);
} finally {
  await admin.end().catch(() => {});
}

// Run schema + seed in separate processes (each closes its own connection pool).
for (const script of ['migrate.js', 'seed.js']) {
  execFileSync(process.execPath, [path.join(dir, script)], { stdio: 'inherit' });
}

console.log('\nAll set. Start the API with: npm run dev');
