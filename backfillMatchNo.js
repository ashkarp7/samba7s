const db = require('./backend/db');

async function fixMatchNumbers() {
    try {
        console.log("Fetching matches...");
        const result = await db.query('SELECT id, match_no, round FROM matches WHERE round != $1 ORDER BY id ASC', ['KNOCKOUT']); // Note: knockout matches might not need numbers, but league matches do

        let counter = 1;
        let updatedCount = 0;

        for (const match of result.rows) {
            if (match.match_no === null || match.match_no === undefined) {
                await db.query('UPDATE matches SET match_no = $1 WHERE id = $2', [counter, match.id]);
                console.log(`Updated Match ID ${match.id} -> Match No ${counter}`);
                updatedCount++;
            }
            counter++;
        }

        console.log(`Successfully backfilled ${updatedCount} matches with a Match No!`);
    } catch (err) {
        console.error("Database error:", err);
    } finally {
        process.exit(0);
    }
}

fixMatchNumbers();
