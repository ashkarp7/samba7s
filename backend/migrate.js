require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log("Adding new columns to matches and standings table...");
        await pool.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS team1_penalties INT;');
        await pool.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS team2_penalties INT;');
        await pool.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS toss_winner_id INT REFERENCES teams(id);');
        await pool.query('ALTER TABLE standings ADD COLUMN IF NOT EXISTS manual_position INT DEFAULT 0;');
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        pool.end();
    }
}

runMigration();
