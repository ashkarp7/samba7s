async function loadAllTeams() {
    const res = await fetch(`${API}/teams`);
    const teams = await res.json();

    const team1 = document.getElementById("team1");
    const team2 = document.getElementById("team2");

    team1.innerHTML = "";
    team2.innerHTML = "";

    teams.forEach(team => {
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

    const isLeagueMatch = (r) => r === "GROUP" || r?.startsWith("Round");

    matches.filter(m => isLeagueMatch(m.round))
        .sort((a, b) => {
            const noA = typeof a.match_no === 'number' ? a.match_no : 9999;
            const noB = typeof b.match_no === 'number' ? b.match_no : 9999;
            return noA - noB;
        })
        .forEach(match => {
            const li = document.createElement("li");
            const roundLabel = match.round === "GROUP" ? "League" : match.round;
            const noLabel = match.match_no ? `Match ${match.match_no} - ` : "";

            li.innerHTML = `
            <span><strong>${noLabel}[${roundLabel}]</strong> ${match.team1} vs ${match.team2} <small style="color: #ccc; margin-left: 10px;">${match.match_time ? new Date(match.match_time).toLocaleString() : 'TBD'}</small></span>
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
    const roundVal = document.getElementById("matchRound").value || "GROUP";
    const timeVal = document.getElementById("matchTime").value;
    const time = timeVal ? new Date(timeVal).toISOString() : null;
    const matchNo = document.getElementById("matchNo").value;

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
            group_name: null,
            stage: "GROUP",
            round: roundVal,
            match_time: time,
            match_no: matchNo ? parseInt(matchNo, 10) : null
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
        const isLeague = m.round === "GROUP" || m.round?.startsWith("Round");
        if (groupFilter === "ALL") return true;
        if (groupFilter === "KNOCKOUTS") return !isLeague;
        return m.round === groupFilter;
    });

    filtered.forEach(match => {
        const option = document.createElement("option");
        option.value = match.id;
        option.dataset.team1 = match.team1;
        option.dataset.team2 = match.team2;

        const isLeague = match.round === "GROUP" || match.round?.startsWith("Round");
        const roundLabel = isLeague ? match.round : match.round;
        const noLabel = match.match_no ? `Match ${match.match_no} - ` : "";

        option.textContent = `${noLabel}[${roundLabel}] ${match.team1} vs ${match.team2}`;
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

            const noLabel = match.match_no ? `Match ${match.match_no} - ` : "";
            li.innerHTML = `
                <span><strong>${match.team1_score} - ${match.team2_score}</strong> | ${noLabel}${match.team1} vs ${match.team2}</span>
                <div>
                    <button onclick="editMatchResult(${match.id})" style="padding: 5px 10px; background: #eaff00; color: black; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Edit Score</button>
                    <button onclick="clearMatchResult(${match.id})" style="padding: 5px 10px; background: #ff4d4d; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin-left: 5px;">Clear Result</button>
                </div>
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

async function clearMatchResult(id) {
    if (!confirm("Are you sure you want to completely clear this match result? This will reverse the points in the standings.")) {
        return;
    }

    try {
        const res = await fetch(`${API}/matches/${id}/clear`, {
            method: "PUT"
        });

        if (res.ok) {
            alert("Match result cleared successfully!");
            if (window.reloadAdminStandings) window.reloadAdminStandings();
            loadMatchesForResult();
        } else {
            alert("Failed to clear result.");
        }
    } catch (err) {
        console.error("Error clearing result:", err);
        alert("Error clearing result.");
    }
}

async function loadPlayersForMatch() {
    const matchSelect = document.getElementById("resultMatch");
    if (matchSelect.selectedIndex < 0) return;

    const opt = matchSelect.options[matchSelect.selectedIndex];
    const team1Name = opt.dataset.team1;
    const team2Name = opt.dataset.team2;

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

loadAllTeams();
loadMatches();
loadMatchesForResult();

async function editMatch(id) {
    document.getElementById("matches").scrollIntoView({ behavior: 'smooth' });

    const res = await fetch(`${API}/matches`);
    const matches = await res.json();
    const match = matches.find(m => m.id === id);
    if (!match) return;

    const tRes = await fetch(`${API}/teams`);
    const teams = await tRes.json();

    const t1 = teams.find(t => t.name === match.team1);
    const t2 = teams.find(t => t.name === match.team2);

    await loadAllTeams();

    if (t1) document.getElementById("team1").value = t1.id;
    if (t2) document.getElementById("team2").value = t2.id;

    if (match.match_time) {
        const d = new Date(match.match_time);
        // Correct timezone offset for HTML datetime-local
        document.getElementById("matchTime").value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } else {
        document.getElementById("matchTime").value = "";
    }

    if (match.match_no) {
        document.getElementById("matchNo").value = match.match_no;
    } else {
        document.getElementById("matchNo").value = "";
    }

    if (match.round && match.round.startsWith("Round")) {
        document.getElementById("matchRound").value = match.round;
    } else {
        document.getElementById("matchRound").value = "Round 1";
    }

    document.getElementById("editMatchId").value = id;
    document.getElementById("btnCreateMatch").style.display = "none";
    document.getElementById("btnUpdateMatch").style.display = "flex";
}

function cancelMatchEdit() {
    document.getElementById("editMatchId").value = "";
    document.getElementById("team1").innerHTML = "";
    document.getElementById("team2").innerHTML = "";
    document.getElementById("matchRound").value = "Round 1";
    document.getElementById("matchNo").value = "";
    document.getElementById("matchTime").value = "";

    document.getElementById("btnCreateMatch").style.display = "block";
    document.getElementById("btnUpdateMatch").style.display = "none";

    // Repopulate dropdowns since we cleared them
    loadAllTeams();
}

async function updateMatchDetails() {
    const id = document.getElementById("editMatchId").value;
    const team1 = document.getElementById("team1").value;
    const team2 = document.getElementById("team2").value;
    const timeVal = document.getElementById("matchTime").value;
    const time = timeVal ? new Date(timeVal).toISOString() : null;
    const matchNo = document.getElementById("matchNo").value;

    if (!id || !team1 || !team2) return;

    try {
        const res = await fetch(`${API}/matches/${id}/details`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                team1_id: team1,
                team2_id: team2,
                group_name: null,
                match_time: time,
                match_no: matchNo ? parseInt(matchNo, 10) : null
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
