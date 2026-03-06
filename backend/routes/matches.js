const express = require("express");
const router = express.Router();
const db = require("../db");

// GET matches
router.get("/", async (req, res) => {
    try {
        const matches = await db.query(`
            SELECT 
                m.id,
                m.group_name,
                t1.name as team1,
                t2.name as team2,
                m.team1_score,
                m.team2_score,
                m.match_time,
                m.round,
                m.team1_scorers,
                m.team2_scorers,
                m.motm,
                m.team1_penalties,
                m.team2_penalties,
                m.toss_winner_id,
                tw.name as toss_winner
            FROM matches m
            JOIN teams t1 ON m.team1_id = t1.id
            JOIN teams t2 ON m.team2_id = t2.id
            LEFT JOIN teams tw ON m.toss_winner_id = tw.id
            ORDER BY m.match_time
        `);
        res.json(matches.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// CREATE MATCH
router.post("/", async (req, res) => {
    try {
        const { team1_id, team2_id, stage, round, group_name, match_time } = req.body;

        if (group_name !== undefined) {
            await db.query(
                `INSERT INTO matches(team1_id,team2_id,stage,round,group_name,match_time) VALUES($1,$2,$3,$4,$5,$6)`,
                [team1_id, team2_id, stage, round, group_name, match_time]
            );
        } else {
            // Optional fallback for older createMatch tests
            await db.query(
                `INSERT INTO matches(team1_id,team2_id,stage,round,match_time) VALUES($1,$2,$3,$4,$5)`,
                [team1_id, team2_id, stage, round, match_time]
            );
        }
        res.json({ message: "Match created" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// UPDATE RESULT
router.put("/:id", async (req, res) => {
    try {
        const { team1_score, team2_score, team1_scorers, team2_scorers, motm, team1_penalties, team2_penalties, toss_winner_id } = req.body;
        const { id } = req.params;

        // Get the match to know the teams involved
        const matchRes = await db.query("SELECT team1_id, team2_id, round, team1_score as old_t1, team2_score as old_t2 FROM matches WHERE id=$1", [id]);
        if (matchRes.rows.length === 0) {
            return res.status(404).json({ message: "Match not found" });
        }
        const { team1_id, team2_id, round, old_t1, old_t2 } = matchRes.rows[0];

        // Update match score and details
        await db.query(
            "UPDATE matches SET team1_score=$1, team2_score=$2, team1_scorers=$3, team2_scorers=$4, motm=$5, team1_penalties=$6, team2_penalties=$7, toss_winner_id=$8 WHERE id=$9",
            [team1_score, team2_score, team1_scorers || null, team2_scorers || null, motm || null, team1_penalties ?? null, team2_penalties ?? null, toss_winner_id || null, id]
        );

        if (round === "GROUP") {
            // Revert previous result if it exists
            if (old_t1 !== null && old_t2 !== null) {
                const o_t1 = parseInt(old_t1, 10);
                const o_t2 = parseInt(old_t2, 10);

                if (o_t1 > o_t2) {
                    await db.query("UPDATE standings SET wins=wins-1, points=points-3 WHERE team_id=$1", [team1_id]);
                    await db.query("UPDATE standings SET losses=losses-1 WHERE team_id=$1", [team2_id]);
                } else if (o_t1 < o_t2) {
                    await db.query("UPDATE standings SET wins=wins-1, points=points-3 WHERE team_id=$1", [team2_id]);
                    await db.query("UPDATE standings SET losses=losses-1 WHERE team_id=$1", [team1_id]);
                } else {
                    await db.query("UPDATE standings SET draws=draws-1, points=points-1 WHERE team_id=$1", [team1_id]);
                    await db.query("UPDATE standings SET draws=draws-1, points=points-1 WHERE team_id=$1", [team2_id]);
                }
                await db.query("UPDATE standings SET goals_for=goals_for-$1, goals_against=goals_against-$2, played=played-1 WHERE team_id=$3", [o_t1, o_t2, team1_id]);
                await db.query("UPDATE standings SET goals_for=goals_for-$1, goals_against=goals_against-$2, played=played-1 WHERE team_id=$3", [o_t2, o_t1, team2_id]);
            }

            // Standings calculation for new scores
            const t1_s = parseInt(team1_score, 10);
            const t2_s = parseInt(team2_score, 10);

            if (t1_s > t2_s) {
                // team1 win
                await db.query(
                    "UPDATE standings SET wins=wins+1, points=points+3 WHERE team_id=$1",
                    [team1_id]
                );
                await db.query(
                    "UPDATE standings SET losses=losses+1 WHERE team_id=$1",
                    [team2_id]
                );
            } else if (t1_s < t2_s) {
                // team2 win
                await db.query(
                    "UPDATE standings SET wins=wins+1, points=points+3 WHERE team_id=$1",
                    [team2_id]
                );
                await db.query(
                    "UPDATE standings SET losses=losses+1 WHERE team_id=$1",
                    [team1_id]
                );
            } else {
                // draw
                await db.query(
                    "UPDATE standings SET draws=draws+1, points=points+1 WHERE team_id=$1",
                    [team1_id]
                );
                await db.query(
                    "UPDATE standings SET draws=draws+1, points=points+1 WHERE team_id=$1",
                    [team2_id]
                );
            }

            // Update Goals
            await db.query(
                "UPDATE standings SET goals_for=goals_for+$1, goals_against=goals_against+$2, played=played+1 WHERE team_id=$3",
                [t1_s, t2_s, team1_id]
            );
            await db.query(
                "UPDATE standings SET goals_for=goals_for+$1, goals_against=goals_against+$2, played=played+1 WHERE team_id=$3",
                [t2_s, t1_s, team2_id]
            );

            // Recalculate Goal Difference
            await db.query(
                "UPDATE standings SET goal_diff = goals_for - goals_against"
            );
        }

        res.json({ message: "Result and standings updated" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// UPDATE MATCH DETAILS (Time/Teams)
router.put("/:id/details", async (req, res) => {
    try {
        const { team1_id, team2_id, group_name, match_time } = req.body;
        const { id } = req.params;

        await db.query(
            "UPDATE matches SET team1_id=$1, team2_id=$2, group_name=$3, match_time=$4 WHERE id=$5",
            [team1_id, team2_id, group_name || null, match_time || null, id]
        );
        res.json({ message: "Match details updated" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// DELETE MATCH
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    await db.query(
        "DELETE FROM matches WHERE id=$1",
        [id]
    );
    res.json({ message: "Match deleted" });
});

module.exports = router;
