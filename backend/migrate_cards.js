require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log("Adding yellow_cards and red_cards columns to players table...");
        await pool.query('ALTER TABLE players ADD COLUMN IF NOT EXISTS yellow_cards INT DEFAULT 0;');
        await pool.query('ALTER TABLE players ADD COLUMN IF NOT EXISTS red_cards INT DEFAULT 0;');
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        pool.end();
    }
}

runMigration();
