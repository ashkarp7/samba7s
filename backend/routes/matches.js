const express = require("express");
const router = express.Router();
const db = require("../db");
const { recalculateStandings } = require("../recalc");

// GET matches
router.get("/", async (req, res) => {
    try {
        const matches = await db.query(`
            SELECT 
                m.id,
                m.match_no,
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
            ORDER BY m.match_no ASC NULLS LAST, m.match_time ASC
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
        const { team1_id, team2_id, stage, round, group_name, match_time, match_no } = req.body;

        if (group_name !== undefined) {
            await db.query(
                `INSERT INTO matches(team1_id,team2_id,stage,round,group_name,match_time,match_no) VALUES($1,$2,$3,$4,$5,$6,$7)`,
                [team1_id, team2_id, stage, round, group_name, match_time || null, match_no || null]
            );
        } else {
            // Optional fallback for older createMatch tests
            await db.query(
                `INSERT INTO matches(team1_id,team2_id,stage,round,match_time,match_no) VALUES($1,$2,$3,$4,$5,$6)`,
                [team1_id, team2_id, stage, round, match_time || null, match_no || null]
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

        // Recalculate standings table from scratch
        if (round === "GROUP" || round?.startsWith("Round")) {
            await recalculateStandings();
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
        const { team1_id, team2_id, group_name, match_time, match_no } = req.body;
        const { id } = req.params;

        await db.query(
            "UPDATE matches SET team1_id=$1, team2_id=$2, group_name=$3, match_time=$4, match_no=$5 WHERE id=$6",
            [team1_id, team2_id, group_name || null, match_time || null, match_no || null, id]
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

    // Get match round before deleting
    const matchRes = await db.query("SELECT round FROM matches WHERE id=$1", [id]);
    const round = matchRes.rows.length > 0 ? matchRes.rows[0].round : null;

    await db.query(
        "DELETE FROM matches WHERE id=$1",
        [id]
    );

    if (round === "GROUP" || round?.startsWith("Round")) {
        await recalculateStandings();
    }

    res.json({ message: "Match deleted and standings recalculated" });
});

module.exports = router;
