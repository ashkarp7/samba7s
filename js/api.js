const API = "https://samba7s.onrender.com";

// Fires instantly on page load to wake Render out of cold start
// before any real data request is made.
(function wakeUpServer() {
    fetch(`${API}/ping`).catch(() => { }); // silent — just warming the server
})();

async function getTeams() {

    const res = await fetch(`${API}/teams`);

    if (!res.ok) {
        throw new Error("Failed to fetch teams");
    }

    return await res.json();

}

async function addTeam(name, group) {

    await fetch(`${API}/teams`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            group_name: group
        })
    });

}

async function deleteTeam(id) {

    await fetch(`${API}/teams/${id}`, {
        method: "DELETE"
    });

}

async function getMatches() {
    const res = await fetch(`${API}/matches`);
    return await res.json();
}

async function createMatch(team1, team2, stage, round, time) {
    // If the old code didn't pass "round", let's handle backwards compatibility by checking if it's 4 vs 5 args
    // Actually, step 4 says: await createMatch(team1,team2,"KNOCKOUT",round,time);
    let matchRound = round;
    let matchTime = time;

    // In step 1: createMatch(team1, team2, stage, time) where stage="GROUP"
    if (time === undefined) {
        matchTime = round; // the 4th arg was time
        matchRound = stage === "GROUP" ? "GROUP" : null;
    }

    await fetch(`${API}/matches`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            team1_id: team1,
            team2_id: team2,
            stage: stage,
            round: matchRound,
            match_time: matchTime
        })
    });
}

async function deleteMatch(id) {
    await fetch(`${API}/matches/${id}`, {
        method: "DELETE"
    });
}