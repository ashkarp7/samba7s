require("dotenv").config();
const db = require("./db");

async function alterTable() {
    try {
        await db.query("ALTER TABLE matches ADD COLUMN match_no INTEGER");
        console.log("SUCCESS: Added match_no column");
    } catch (e) {
        if (e.message.includes("already exists")) {
            console.log("SUCCESS: match_no column already exists");
        } else {
            console.error("ERROR:", e.message);
        }
    }
    process.exit();
}
alterTable();
