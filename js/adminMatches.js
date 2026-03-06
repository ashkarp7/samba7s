async function loadTeamsByGroup() {
    const group = document.getElementById("groupSelect").value;
    const res = await fetch(`${API}/teams`);
    const teams = await res.json();

    const team1 = document.getElementById("team1");
    const team2 = document.getElementById("team2");

    team1.innerHTML = "";
    team2.innerHTML = "";

    teams
        .filter(t => t.group_name === group)
        .forEach(team => {
            const opt1 = document.createElement("option");
            opt1.value = team.id;
            opt1.textContent = team.name;

            const opt2 = opt1.cloneNode(true);

            team1.appendChild(opt1);
            team2.appendChild(opt2);
        });
}
async function loadMatches() {
    const matches = await getMatches();
    const list = document.getElementById("matchList");
    list.innerHTML = "";

    const filterVal = document.getElementById("adminMatchFilter")?.value || "ALL";

    matches.filter(m => filterVal === "ALL" || m.group_name === filterVal)
        .forEach(match => {
            const li = document.createElement("li");

            li.innerHTML = `
            <span>${match.team1} vs ${match.team2} <small style="color: #ccc; margin-left: 10px;">${match.match_time ? new Date(match.match_time).toLocaleString() : 'No Time'}</small></span>
            <div>
                <button onclick="editMatch(${match.id})" style="padding: 5px 10px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer;">Edit Match</button>
                <button onclick="removeMatch(${match.id})" style="padding: 5px 10px; background: #ff4d4d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 5px;">Delete</button>
            </div>
        `;

            list.appendChild(li);
        });
}

async function addMatch() {
    const team1 = document.getElementById("team1").value;
    const team2 = document.getElementById("team2").value;
    const group = document.getElementById("groupSelect").value;
    const time = document.getElementById("matchTime").value;

    if (team1 === team2) {
        alert("Select two different teams");
        return;
    }

    await fetch(`${API}/matches`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            team1_id: team1,
            team2_id: team2,
            group_name: group,
            stage: "GROUP",
            round: "GROUP",
            match_time: time
        })
    });

    loadMatches();
    loadMatchesForResult();
}

async function removeMatch(id) {
    await deleteMatch(id);
    loadMatches();
}

async function loadMatchesForResult() {
    const res = await fetch(`${API}/matches`);
    const matches = await res.json();

    const select = document.getElementById("resultMatch");
    if (!select) return;

    const groupFilter = document.getElementById("resultGroupFilter")?.value || "ALL";

    select.innerHTML = "";

    const filtered = matches.filter(m => {
        if (groupFilter === "ALL") return true;
        if (groupFilter === "KNOCKOUTS") return m.round !== "GROUP";
        return m.group_name === groupFilter;
    });

    filtered.forEach(match => {
        const option = document.createElement("option");
        option.value = match.id;
        option.dataset.team1 = match.team1;
        option.dataset.team2 = match.team2;
        option.textContent = `${match.round !== "GROUP" ? match.round + ' : ' : ''}${match.team1} vs ${match.team2}`;
        select.appendChild(option);
    });

    // Auto-load players for the first match if any exist
    if (filtered.length > 0) {
        loadPlayersForMatch();
    } else {
        document.getElementById("t1ScorersList").innerHTML = "";
        document.getElementById("t2ScorersList").innerHTML = "";
        document.getElementById("t1ScorerSelect").innerHTML = '<option value="OG">Own Goal (OG)</option>';
        document.getElementById("t2ScorerSelect").innerHTML = '<option value="OG">Own Goal (OG)</option>';
        document.getElementById("motm").innerHTML = '<option value="">-- No MOTM Selected --</option>';
    }

    const completedList = document.getElementById("completedMatchesList");
    if (completedList) {
        completedList.innerHTML = "";
        filtered.filter(m => m.team1_score !== null).forEach(match => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.marginBottom = "10px";
            li.style.padding = "10px";
            li.style.background = "rgba(255,255,255,0.05)";
            li.style.borderRadius = "6px";

            li.innerHTML = `
                <span><strong>${match.team1_score} - ${match.team2_score}</strong> | ${match.team1} vs ${match.team2}</span>
                <button onclick="editMatchResult(${match.id})" style="padding: 5px 10px; background: #eaff00; color: black; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Edit Score</button>
            `;
            completedList.appendChild(li);
        });
    }
}

async function updateResult() {
    const matchId = document.getElementById("resultMatch").value;
    const s1 = document.getElementById("score1").value;
    const s2 = document.getElementById("score2").value;

    // Additional Optional Match Stats (List-based)
    const s1List = document.getElementById("t1ScorersList").children;
    const team1_scorers = Array.from(s1List).map(li => li.dataset.player).join(", ");

    const s2List = document.getElementById("t2ScorersList").children;
    const team2_scorers = Array.from(s2List).map(li => li.dataset.player).join(", ");

    const motm = document.getElementById("motm").value;
    const p1 = document.getElementById("penalties1").value;
    const p2 = document.getElementById("penalties2").value;
    const toss = document.getElementById("tossWinner").value;

    if (!matchId || s1 === "" || s2 === "") {
        alert("Please fill in both scores.");
        return;
    }

    try {
        await fetch(`${API}/matches/${matchId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                team1_score: parseInt(s1, 10),
                team2_score: parseInt(s2, 10),
                team1_scorers: team1_scorers,
                team2_scorers: team2_scorers,
                motm: motm,
                team1_penalties: p1 ? parseInt(p1, 10) : null,
                team2_penalties: p2 ? parseInt(p2, 10) : null,
                toss_winner_id: toss || null
            })
        });

        alert("Result Updated");
        // Clear fields
        document.getElementById("score1").value = "";
        document.getElementById("score2").value = "";
        document.getElementById("t1ScorersList").innerHTML = "";
        document.getElementById("t2ScorersList").innerHTML = "";
        document.getElementById("motm").value = "";

        // Refresh Standings tables if they happen to be drawn
        if (window.reloadAdminStandings) window.reloadAdminStandings();
        loadMatchesForResult();

    } catch (err) {
        console.error("Failed to update result:", err);
        alert("Error updating result.");
    }
}

async function loadPlayersForMatch() {
    const matchSelect = document.getElementById("resultMatch");
    if (matchSelect.selectedIndex < 0) return;

    const opt = matchSelect.options[matchSelect.selectedIndex];
    const team1Name = opt.dataset.team1;
    const team2Name = opt.dataset.team2;

    // We need to fetch the original match object or team IDs to fetch players reliably
    // A quick hack is to fetch all teams and match the exact name
    const teamsRes = await fetch(`${API}/teams`);
    const teams = await teamsRes.json();

    const team1 = teams.find(t => t.name === team1Name);
    const team2 = teams.find(t => t.name === team2Name);

    if (!team1 || !team2) return;

    const pRes = await fetch(`${API}/players`);
    const players = await pRes.json();

    const p1select = document.getElementById("t1ScorerSelect");
    const p2select = document.getElementById("t2ScorerSelect");
    const motmSelect = document.getElementById("motm");

    p1select.innerHTML = '<option value="OG">Own Goal (OG)</option>';
    p2select.innerHTML = '<option value="OG">Own Goal (OG)</option>';
    motmSelect.innerHTML = '<option value="">-- No MOTM Selected --</option>';

    // Clear existing scorer lists when changing matches
    document.getElementById("t1ScorersList").innerHTML = "";
    document.getElementById("t2ScorersList").innerHTML = "";

    const t1Roster = players.filter(p => p.team_id === team1.id);
    const t2Roster = players.filter(p => p.team_id === team2.id);

    t1Roster.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.name;
        opt.textContent = p.name;
        p1select.appendChild(opt);
        motmSelect.appendChild(opt.cloneNode(true));
    });

    t2Roster.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.name;
        opt.textContent = p.name;
        p2select.appendChild(opt);
        motmSelect.appendChild(opt.cloneNode(true));
    });

    // Populate toss winner dropdown
    const tossDropdown = document.getElementById("tossWinner");
    tossDropdown.innerHTML = '<option value="">-- Toss Winner (If Penalties Tied) --</option>';
    const tOpt1 = document.createElement("option");
    tOpt1.value = team1.id;
    tOpt1.textContent = team1.name;
    const tOpt2 = document.createElement("option");
    tOpt2.value = team2.id;
    tOpt2.textContent = team2.name;
    tossDropdown.appendChild(tOpt1);
    tossDropdown.appendChild(tOpt2);

    checkKnockoutDraw();
}

function checkKnockoutDraw() {
    const s1 = document.getElementById("score1").value;
    const s2 = document.getElementById("score2").value;
    const matchSelect = document.getElementById("resultMatch");
    if (!matchSelect || matchSelect.selectedIndex < 0) return;

    // Check if match is a knockout
    const matchText = matchSelect.options[matchSelect.selectedIndex].textContent;
    const isKnockout = matchText.includes("PREQUARTER") || matchText.includes("QUARTER") || matchText.includes("SEMI") || matchText.includes("FINAL");

    const ui = document.getElementById("knockoutResolution");
    if (isKnockout && s1 !== "" && s2 !== "" && s1 === s2) {
        ui.style.display = "block";
    } else {
        ui.style.display = "none";
        document.getElementById("penalties1").value = "";
        document.getElementById("penalties2").value = "";
        document.getElementById("tossWinner").value = "";
    }
}

function addScorer(teamNum) {
    const select = document.getElementById(`t${teamNum}ScorerSelect`);
    const list = document.getElementById(`t${teamNum}ScorersList`);
    const playerName = select.value;

    if (!playerName) return;

    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.padding = "5px";
    li.style.background = "#222";
    li.style.marginTop = "2px";
    li.dataset.player = playerName;

    li.innerHTML = `
        <span>⚽ ${playerName}</span>
        <button onclick="this.parentElement.remove()" style="background: red; color: white; border: none; padding: 2px 5px; cursor: pointer;">X</button>
    `;

    list.appendChild(li);
}

loadMatches();
loadMatchesForResult();

async function editMatch(id) {
    document.getElementById("matches").scrollIntoView({ behavior: 'smooth' });

    const res = await fetch(`${API}/matches`);
    const matches = await res.json();
    const match = matches.find(m => m.id === id);
    if (!match) return;

    // We must find the exact team IDs for the dropdowns. 
    // Re-fetch teams to align names -> IDs
    const tRes = await fetch(`${API}/teams`);
    const teams = await tRes.json();

    const t1 = teams.find(t => t.name === match.team1);
    const t2 = teams.find(t => t.name === match.team2);

    document.getElementById("groupSelect").value = match.group_name || "";
    await loadTeamsByGroup(); // repopulates team selects based on group

    if (t1) document.getElementById("team1").value = t1.id;
    if (t2) document.getElementById("team2").value = t2.id;

    if (match.match_time) {
        document.getElementById("matchTime").value = new Date(match.match_time).toISOString().slice(0, 16);
    } else {
        document.getElementById("matchTime").value = "";
    }

    document.getElementById("editMatchId").value = id;
    document.getElementById("btnCreateMatch").style.display = "none";
    document.getElementById("btnUpdateMatch").style.display = "flex";
}

function cancelMatchEdit() {
    document.getElementById("editMatchId").value = "";
    document.getElementById("team1").innerHTML = "";
    document.getElementById("team2").innerHTML = "";
    document.getElementById("groupSelect").value = "";
    document.getElementById("matchTime").value = "";

    document.getElementById("btnCreateMatch").style.display = "block";
    document.getElementById("btnUpdateMatch").style.display = "none";
}

async function updateMatchDetails() {
    const id = document.getElementById("editMatchId").value;
    const team1 = document.getElementById("team1").value;
    const team2 = document.getElementById("team2").value;
    const group = document.getElementById("groupSelect").value;
    const time = document.getElementById("matchTime").value;

    if (!id || !team1 || !team2) return;

    try {
        const res = await fetch(`${API}/matches/${id}/details`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                team1_id: team1,
                team2_id: team2,
                group_name: group,
                match_time: time || null
            })
        });

        if (res.ok) {
            alert("Match details updated");
            cancelMatchEdit();
            loadMatches();
            loadMatchesForResult();
        } else {
            alert("Failed to update match");
        }
    } catch (err) {
        console.error("Error updating match", err);
    }
}

async function editMatchResult(id) {
    document.getElementById("results").scrollIntoView({ behavior: 'smooth' });

    const matchSelect = document.getElementById("resultMatch");
    matchSelect.value = id;

    await loadPlayersForMatch();

    const res = await fetch(`${API}/matches`);
    const matches = await res.json();
    const match = matches.find(m => m.id === id);

    if (match) {
        document.getElementById("score1").value = match.team1_score;
        document.getElementById("score2").value = match.team2_score;

        if (match.motm) document.getElementById("motm").value = match.motm;

        if (match.team1_penalties !== null) document.getElementById("penalties1").value = match.team1_penalties;
        if (match.team2_penalties !== null) document.getElementById("penalties2").value = match.team2_penalties;
        if (match.toss_winner_id) document.getElementById("tossWinner").value = match.toss_winner_id;

        checkKnockoutDraw();

        const t1ScorersList = document.getElementById("t1ScorersList");
        const t2ScorersList = document.getElementById("t2ScorersList");

        const attachScorers = (csvString, listEl) => {
            if (!csvString) return;
            csvString.split(",").map(s => s.trim()).forEach(playerName => {
                if (!playerName) return;
                const li = document.createElement("li");
                li.style.display = "flex";
                li.style.justifyContent = "space-between";
                li.style.padding = "5px";
                li.style.background = "#222";
                li.style.marginTop = "2px";
                li.dataset.player = playerName;
                li.innerHTML = `<span>⚽ ${playerName}</span><button onclick="this.parentElement.remove()" style="background: red; color: white; border: none; padding: 2px 5px; cursor: pointer;">X</button>`;
                listEl.appendChild(li);
            });
        };

        attachScorers(match.team1_scorers, t1ScorersList);
        attachScorers(match.team2_scorers, t2ScorersList);
    }
}
