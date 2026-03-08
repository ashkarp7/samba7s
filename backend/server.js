require("dotenv").config();

console.log("DATABASE URL:", process.env.DATABASE_URL);

const express = require("express");
const cors = require("cors");

const teamRoutes = require("./routes/teams");
const playerRoutes = require("./routes/players");
const matchRoutes = require("./routes/matches");
const standingsRoutes = require("./routes/standings");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/teams", teamRoutes);
app.use("/players", playerRoutes);
app.use("/matches", matchRoutes);
app.use("/standings", standingsRoutes);

// Keep-alive health check — used by cron jobs to prevent Render cold starts
app.get("/ping", (req, res) => res.json({ status: "ok", ts: Date.now() }));

app.listen(5000, () => {
    console.log("Server running on port 5000");
});