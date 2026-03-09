require('dotenv').config();
const db = require('./db');

async function checkMatches() {
    try {
        const result = await db.query('SELECT id, match_no, round, team1_id, team2_id FROM matches ORDER BY id ASC LIMIT 15');
        console.table(result.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkMatches();
