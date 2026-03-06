const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all teams
router.get("/", async (req, res) => {
    const teams = await db.query("SELECT * FROM teams ORDER BY name");
    res.json(teams.rows);
});

// ADD TEAM
router.post("/", async (req, res) => {
    const { name, group_name } = req.body;
    const team = await db.query(
        "INSERT INTO teams(name, group_name) VALUES($1,$2) RETURNING id",
        [name, group_name]
    );

    const teamId = team.rows[0].id;

    await db.query(
        "INSERT INTO standings(team_id, group_name) VALUES($1,$2)",
        [teamId, group_name]
    );

    res.json({ message: "Team added" });
});

// UPDATE TEAM GROUP
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { group_name } = req.body;

        await db.query("UPDATE teams SET group_name=$1 WHERE id=$2", [group_name, id]);
        await db.query("UPDATE standings SET group_name=$1 WHERE team_id=$2", [group_name, id]);

        res.json({ message: "Team group updated" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// UPDATE TEAM NAME
router.put("/:id/name", async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        await db.query("UPDATE teams SET name=$1 WHERE id=$2", [name, id]);
        res.json({ message: "Team name updated" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// DELETE TEAM
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    await db.query(
        "DELETE FROM teams WHERE id=$1",
        [id]
    );
    res.json({ message: "Team deleted" });
});

module.exports = router;
