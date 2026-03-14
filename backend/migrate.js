require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log("Adding new columns to matches table...");
        await pool.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS team1_penalties INT;');
        await pool.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS team2_penalties INT;');
        await pool.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS toss_winner_id INT REFERENCES teams(id);');
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        pool.end();
    }
}

runMigration();
