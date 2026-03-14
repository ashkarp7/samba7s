const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all standings
router.get("/", async (req, res) => {
    try {
        const table = await db.query(`
        SELECT
            teams.id as team_id,
            teams.name,
            teams.group_name,
            COALESCE(standings.played, 0) as played,
            COALESCE(standings.wins, 0) as wins,
            COALESCE(standings.draws, 0) as draws,
            COALESCE(standings.losses, 0) as losses,
            COALESCE(standings.goals_for, 0) as goals_for,
            COALESCE(standings.goals_against, 0) as goals_against,
            COALESCE(standings.goal_diff, 0) as goal_diff,
            COALESCE(standings.points, 0) as points,
            COALESCE(standings.manual_position, 0) as manual_position
            FROM teams
            LEFT JOIN standings ON teams.id = standings.team_id
            ORDER BY points DESC, manual_position DESC, goal_diff DESC, goals_for DESC
            `);
        res.json(table.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Admin override to update standings manually
router.put("/:team_id", async (req, res) => {
    try {
        const { team_id } = req.params;
        const { played, wins, draws, losses, goals_for, goals_against, goal_diff, points, manual_position } = req.body;

        const updateRes = await db.query(
            `UPDATE standings 
             SET played=$1, wins=$2, draws=$3, losses=$4, goals_for=$5, goals_against=$6, goal_diff=$7, points=$8, manual_position=$9
             WHERE team_id=$10`,
            [played, wins, draws, losses, goals_for, goals_against, goal_diff, points, manual_position || 0, team_id]
        );

        if (updateRes.rowCount === 0) {
            // Team exists but doesn't have a standings row yet, so we insert it!
            // Need the group_name for insertion. Let's fetch it first.
            const teamRes = await db.query("SELECT group_name FROM teams WHERE id=$1", [team_id]);
            if (teamRes.rows.length > 0) {
                await db.query(
                    `INSERT INTO standings (team_id, group_name, played, wins, draws, losses, goals_for, goals_against, goal_diff, points, manual_position) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [team_id, teamRes.rows[0].group_name, played, wins, draws, losses, goals_for, goals_against, goal_diff, points, manual_position || 0]
                );
            }
        }

        res.json({ message: "Standings updated completely" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
