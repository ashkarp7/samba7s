const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all players (JOIN with team name)
router.get("/", async (req, res) => {
    try {
        const { team_id } = req.query;
        let query = `
            SELECT p.id, p.name, p.team_id, t.name as team_name, p.goals, p.clean_sheets 
            FROM players p
            JOIN teams t ON p.team_id = t.id
        `;
        const params = [];

        if (team_id) {
            query += " WHERE p.team_id = $1 ";
            params.push(team_id);
        }

        query += " ORDER BY p.name ASC";

        const players = await db.query(query, params);
        res.json(players.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ADD PLAYER (Max 12 per team)
router.post("/", async (req, res) => {
    try {
        const { name, team_id } = req.body;

        const countRes = await db.query("SELECT COUNT(*) FROM players WHERE team_id = $1", [team_id]);
        const currentCount = parseInt(countRes.rows[0].count, 10);

        if (currentCount >= 12) {
            return res.status(400).json({ error: "Maximum of 12 players allowed per team" });
        }

        const newPlayer = await db.query(
            "INSERT INTO players (name, team_id) VALUES ($1, $2) RETURNING *",
            [name, team_id]
        );
        res.json(newPlayer.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// UPDATE PLAYER STATS
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { goals, clean_sheets } = req.body;

        await db.query(
            "UPDATE players SET goals = $1, clean_sheets = $2 WHERE id = $3",
            [goals, clean_sheets, id]
        );
        res.json({ message: "Player stats updated" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// UPDATE PLAYER NAME
router.put("/:id/name", async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        await db.query("UPDATE players SET name=$1 WHERE id=$2", [name, id]);
        res.json({ message: "Player name updated" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// DELETE PLAYER
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM players WHERE id=$1", [id]);
        res.json({ message: "Player deleted" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
