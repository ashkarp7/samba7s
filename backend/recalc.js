require("dotenv").config();
const db = require("./db"); // assuming inside backend dir

async function recalculateStandings() {
    // 1. Reset all standings to 0
    await db.query("UPDATE standings SET played=0, wins=0, draws=0, losses=0, goals_for=0, goals_against=0, goal_diff=0, points=0");

    // 2. Get all group/league matches with a valid score
    const res = await db.query("SELECT * FROM matches WHERE (round='GROUP' OR round LIKE 'Round%') AND team1_score IS NOT NULL AND team2_score IS NOT NULL");
    const matches = res.rows;

    for (const m of matches) {
        const t1_s = m.team1_score;
        const t2_s = m.team2_score;
        const t1_id = m.team1_id;
        const t2_id = m.team2_id;

        if (t1_s > t2_s) {
            await db.query("UPDATE standings SET wins=wins+1, points=points+3 WHERE team_id=$1", [t1_id]);
            await db.query("UPDATE standings SET losses=losses+1 WHERE team_id=$1", [t2_id]);
        } else if (t1_s < t2_s) {
            await db.query("UPDATE standings SET wins=wins+1, points=points+3 WHERE team_id=$1", [t2_id]);
            await db.query("UPDATE standings SET losses=losses+1 WHERE team_id=$1", [t1_id]);
        } else {
            await db.query("UPDATE standings SET draws=draws+1, points=points+1 WHERE team_id=$1", [t1_id]);
            await db.query("UPDATE standings SET draws=draws+1, points=points+1 WHERE team_id=$1", [t2_id]);
        }
        await db.query("UPDATE standings SET goals_for=goals_for+$1, goals_against=goals_against+$2, played=played+1 WHERE team_id=$3", [t1_s, t2_s, t1_id]);
        await db.query("UPDATE standings SET goals_for=goals_for+$1, goals_against=goals_against+$2, played=played+1 WHERE team_id=$3", [t2_s, t1_s, t2_id]);
    }

    await db.query("UPDATE standings SET goal_diff = goals_for - goals_against");
    console.log("Standings recalculated.");
}

module.exports = { recalculateStandings };
