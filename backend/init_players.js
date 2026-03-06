require("dotenv").config();
const db = require("./db");

async function initPlayersDB() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS players (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                team_id INT REFERENCES teams(id) ON DELETE CASCADE,
                goals INT DEFAULT 0,
                clean_sheets INT DEFAULT 0
            );
        `);
        console.log("Players table verified.");

        await db.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS team1_scorers TEXT;`);
        await db.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS team2_scorers TEXT;`);
        await db.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS motm VARCHAR(255);`);
        console.log("Matches columns expanded.");

        process.exit();
    } catch (err) {
        console.error("DB Init error", err);
        process.exit(1);
    }
}

initPlayersDB();
