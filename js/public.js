
async function loadStandings() {
    try {
        const res = await fetch(`${API}/standings`);
        const data = await res.json();

        const container = document.getElementById("groups");

        if (!container) return;

        container.innerHTML = "";

        const groups = {
            "A": [], "B": [], "C": [], "D": [], "E": [], "F": []
        };

        data.forEach(team => {
            if (groups[team.group_name]) {
                groups[team.group_name].push(team);
            } else {
                groups[team.group_name] = [team];
            }
        });

        for (const group in groups) {
            const groupDiv = document.createElement("div");

            groupDiv.innerHTML = `<h2>Group ${group}</h2>`;

            const table = document.createElement("table");

            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>P</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>GD</th>
                        <th>PTS</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            if (groups[group].length === 0) {
                // Render an empty 'blank' row if no teams are in this group yet.
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>-</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                `;
                table.querySelector("tbody").appendChild(row);
            } else {
                groups[group].forEach(team => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${team.name}</td>
                        <td>${team.played}</td>
                        <td>${team.wins}</td>
                        <td>${team.draws}</td>
                        <td>${team.losses}</td>
                        <td>${team.goal_diff}</td>
                        <td>${team.points}</td>
                    `;
                    table.querySelector("tbody").appendChild(row);
                });
            }

            groupDiv.appendChild(table);
            container.appendChild(groupDiv);
        }
    } catch (err) {
        console.error("Failed to load standings:", err);
    }
}

async function loadMatches() {
    const res = await fetch(`${API}/matches`);
    const matches = await res.json();

    const groupFilter = document.getElementById("groupFilter")?.value || "ALL";

    const container = document.getElementById("matchList");
    if (!container) return;

    container.innerHTML = "";

    const groupedMatches = { GROUP: [], PREQUARTER: [], QUARTER: [], SEMI: [], FINAL: [] };
    const roundsMap = { PREQUARTER: "PRE-QUARTER FINALS", QUARTER: "QUARTER FINALS", SEMI: "SEMI FINALS", FINAL: "FINALS" };

    matches.forEach(m => {
        let r = m.round || "GROUP";
        if (!groupedMatches[r]) r = "GROUP";

        if (groupFilter === "ALL") {
            groupedMatches[r].push(m);
        } else if (groupFilter === "KNOCKOUTS") {
            if (r !== "GROUP") groupedMatches[r].push(m);
        } else {
            if (r === "GROUP" && m.group_name === groupFilter) {
                groupedMatches[r].push(m);
            }
        }
    });

    const renderCard = (match) => {
        const div = document.createElement("div");
        div.className = "match-card"; // Re-added style class for CSS spacing
        div.style.flexDirection = "column";

        const date = new Date(match.match_time);
        const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let matchTypeLabel = match.round === "GROUP" ? "Group Stage: Group " + match.group_name : (roundsMap[match.round] || match.round);

        div.innerHTML = `
            <div style="width: 100%;">
                <div class="teams" style="display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: bold;">
                    <div style="flex: 1; text-align: right; word-wrap: break-word;">${match.team1}</div>
                    <div style="margin: 0 15px; color: #d4ff00; white-space: nowrap;">${match.team1_score !== null ? match.team1_score + ' - ' + match.team2_score : 'VS'}</div>
                    <div style="flex: 1; text-align: left; word-wrap: break-word;">${match.team2}</div>
                </div>
                <div class="match-time" style="text-align: center; font-size: 10px; color: #666; margin-top: 8px;">
                    ${matchTypeLabel} • ${match.team1_score !== null ? 'FT • ' : ''}${match.match_time ? formattedDate : ""}
                </div>
            </div>
        `;

        container.appendChild(div);
    };

    if (groupedMatches.GROUP.length > 0) {
        groupedMatches.GROUP.forEach(renderCard);
    }

    ["PREQUARTER", "QUARTER", "SEMI", "FINAL"].forEach(r => {
        if (groupedMatches[r].length > 0) {
            const h2 = document.createElement("h2");
            h2.style.cssText = "width: 100%; text-align: center; color: #eaff00; font-family: 'Bebas Neue'; margin-top: 40px; margin-bottom: 20px; font-size: 32px; letter-spacing: 2px;";
            h2.innerText = roundsMap[r];
            container.appendChild(h2);
            groupedMatches[r].forEach(renderCard);
        }
    });
}

async function loadUpcomingMatches() {
    const res = await fetch(`${API}/matches`);
    const matches = await res.json();

    const container = document.getElementById("upcomingMatches");
    if (!container) return;

    container.innerHTML = "";

    const now = new Date();

    const roundsMap = { PREQUARTER: "PRE-QUARTER FINALS", QUARTER: "QUARTER FINALS", SEMI: "SEMI FINALS", FINAL: "FINALS" };

    matches
        .filter(m => new Date(m.match_time) > now)
        .slice(0, 5)
        .forEach(match => {
            const date = new Date(match.match_time);
            const formatted = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let matchTypeLabel = match.round === "GROUP" ? "Group Stage: Group " + match.group_name : (roundsMap[match.round] || match.round);

            const card = document.createElement("div");
            card.className = "match-card"; // preserve original styling
            card.style.flexDirection = "column";

            card.innerHTML = `
                <div style="width: 100%;">
                    <div class="teams" style="display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: bold;">
                        <div style="flex: 1; text-align: right; word-wrap: break-word;">${match.team1}</div>
                        <div style="margin: 0 15px; color: #d4ff00; white-space: nowrap;">VS</div>
                        <div style="flex: 1; text-align: left; word-wrap: break-word;">${match.team2}</div>
                    </div>
                    <div class="match-time" style="text-align: center; font-size: 10px; color: #666; margin-top: 8px;">
                        ${matchTypeLabel} • ${formatted}
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
}

async function loadLatestResults() {
    const res = await fetch(`${API}/matches`);
    const matches = await res.json();

    const container = document.getElementById("latestResults");
    if (!container) return;

    container.innerHTML = "";

    const roundsMap = { PREQUARTER: "PRE-QUARTER FINALS", QUARTER: "QUARTER FINALS", SEMI: "SEMI FINALS", FINAL: "FINALS" };

    matches
        .filter(m => m.team1_score !== null)
        .slice(-5)
        .reverse()
        .forEach(match => {
            const card = document.createElement("div");
            card.className = "match-card"; // preserve original styling
            card.style.cursor = "pointer";
            card.style.flexDirection = "column";

            let matchTypeLabel = match.round === "GROUP" ? "Group Stage: Group " + match.group_name : (roundsMap[match.round] || match.round);

            let detailsHTML = `<div id="details-${match.id}" style="display: none; border-top: 1px solid #330; margin-top: 15px; padding-top: 15px; width: 100%;">`;
            let hasDetails = false;
            let t1ScorersHTML = "";
            let t2ScorersHTML = "";

            if (match.team1_scorers) {
                match.team1_scorers.split(",").forEach(s => {
                    const name = s.trim();
                    if (name) t1ScorersHTML += `<div style="margin-bottom: 4px;">⚽ ${name}</div>`;
                });
            }

            if (match.team2_scorers) {
                match.team2_scorers.split(",").forEach(s => {
                    const name = s.trim();
                    if (name) t2ScorersHTML += `<div style="margin-bottom: 4px;">⚽ ${name}</div>`;
                });
            }

            if (t1ScorersHTML || t2ScorersHTML) {
                hasDetails = true;
                detailsHTML += `
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #aaa; margin-bottom: 12px; width: 100%;">
                        <div style="flex: 1; text-align: left; padding-right: 10px;">${t1ScorersHTML}</div>
                        <div style="flex: 1; text-align: right; padding-left: 10px;">${t2ScorersHTML}</div>
                    </div>
                `;
            }

            if (match.motm) {
                hasDetails = true;
                detailsHTML += `<div style="text-align: center; font-size: 13px; color: #eaff00; font-weight: bold; border-top: 1px dashed #444; padding-top: 12px; margin-top: 5px;">⭐ MOTM: ${match.motm}</div>`;
            }

            detailsHTML += `</div>`;

            if (!hasDetails) {
                detailsHTML = "";
                card.style.cursor = "default";
            }

            let knockoutResHTML = "";
            if (match.team1_penalties !== null && match.team2_penalties !== null) {
                knockoutResHTML = `<div style="text-align: center; color: #ffbf00; font-size: 13px; font-weight: bold; margin-top: 5px;">Pens: ${match.team1_penalties} - ${match.team2_penalties}</div>`;
                if (match.toss_winner) {
                    knockoutResHTML += `<div style="text-align: center; color: #ffbf00; font-size: 12px; margin-top: 2px;">Toss: ${match.toss_winner} won</div>`;
                }
            } else if (match.toss_winner) {
                knockoutResHTML = `<div style="text-align: center; color: #ffbf00; font-size: 13px; font-weight: bold; margin-top: 5px;">Toss Winner: ${match.toss_winner}</div>`;
            }

            card.innerHTML = `
                <div style="width: 100%;">
                    <div class="teams" style="display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: bold;">
                        <div style="flex: 1; text-align: right; word-wrap: break-word;">${match.team1}</div>
                        <div style="margin: 0 15px; color: #d4ff00; white-space: nowrap;">${match.team1_score} - ${match.team2_score}</div>
                        <div style="flex: 1; text-align: left; word-wrap: break-word;">${match.team2}</div>
                    </div>
                    ${knockoutResHTML}
                    <div class="match-time" style="text-align: center; font-size: 10px; color: #666; margin-top: 8px;">${matchTypeLabel} • FT</div>
                </div>
                ${detailsHTML}
            `;

            if (hasDetails) {
                card.onclick = () => {
                    const d = document.getElementById(`details-${match.id}`);
                    d.style.display = d.style.display === "none" ? "block" : "none";
                };
            }

            container.appendChild(card);
        });
}

function startCountdown() {
    const target = new Date("March 9, 2026 09:00:00").getTime();

    setInterval(() => {
        const now = new Date().getTime();
        const diff = target - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const dElem = document.getElementById("days");
        const hElem = document.getElementById("hours");
        const mElem = document.getElementById("minutes");
        const sElem = document.getElementById("seconds");

        if (dElem) dElem.innerText = days;
        if (hElem) hElem.innerText = hours;
        if (mElem) mElem.innerText = minutes;
        if (sElem) sElem.innerText = seconds;
    }, 1000);
}

async function loadHomeStandings() {
    const res = await fetch(`${API}/standings`);
    const data = await res.json();

    const container = document.getElementById("homeStandings");
    if (!container) return;

    container.innerHTML = "";

    data.slice(0, 6).forEach(team => {
        const div = document.createElement("div");
        div.className = "match-card"; // maintain card UI feel
        div.innerHTML = `${team.name} - <span style="float: right;">${team.points} pts</span>`;
        container.appendChild(div);
    });
}

async function loadAllResults() {
    const res = await fetch(`${API}/matches`);
    const matches = await res.json();

    const container = document.getElementById("resultsList");
    if (!container) return;

    container.innerHTML = "";

    const groupFilter = document.getElementById("groupFilter")?.value || "ALL";

    const groupedMatches = { GROUP: [], PREQUARTER: [], QUARTER: [], SEMI: [], FINAL: [] };
    const roundsMap = { PREQUARTER: "PRE-QUARTER FINALS", QUARTER: "QUARTER FINALS", SEMI: "SEMI FINALS", FINAL: "FINALS" };

    matches.filter(m => m.team1_score !== null).forEach(m => {
        let r = m.round || "GROUP";
        if (!groupedMatches[r]) r = "GROUP";

        if (groupFilter === "ALL") {
            groupedMatches[r].push(m);
        } else if (groupFilter === "KNOCKOUTS") {
            if (r !== "GROUP") groupedMatches[r].push(m);
        } else {
            if (r === "GROUP" && m.group_name === groupFilter) {
                groupedMatches[r].push(m);
            }
        }
    });

    const renderCard = (match) => {
        const div = document.createElement("div");
        div.className = "match-card";
        div.style.cursor = "pointer";
        div.style.flexDirection = "column";

        const date = new Date(match.match_time);
        const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let detailsHTML = `<div id="details-all-${match.id}" style="display: none; border-top: 1px solid #330; margin-top: 15px; padding-top: 15px; width: 100%;">`;
        let hasDetails = false;
        let t1ScorersHTML = "";
        let t2ScorersHTML = "";

        if (match.team1_scorers) {
            match.team1_scorers.split(",").forEach(s => {
                const name = s.trim();
                if (name) t1ScorersHTML += `<div style="margin-bottom: 4px;">⚽ ${name}</div>`;
            });
        }

        if (match.team2_scorers) {
            match.team2_scorers.split(",").forEach(s => {
                const name = s.trim();
                if (name) t2ScorersHTML += `<div style="margin-bottom: 4px;">⚽ ${name}</div>`;
            });
        }

        if (t1ScorersHTML || t2ScorersHTML) {
            hasDetails = true;
            detailsHTML += `
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #aaa; margin-bottom: 12px; width: 100%;">
                    <div style="flex: 1; text-align: left; padding-right: 10px;">${t1ScorersHTML}</div>
                    <div style="flex: 1; text-align: right; padding-left: 10px;">${t2ScorersHTML}</div>
                </div>
            `;
        }

        if (match.motm) {
            hasDetails = true;
            detailsHTML += `<div style="text-align: center; font-size: 13px; color: #eaff00; font-weight: bold; border-top: 1px dashed #444; padding-top: 12px; margin-top: 5px;">⭐ MOTM: ${match.motm}</div>`;
        }

        detailsHTML += `</div>`;

        if (!hasDetails) {
            detailsHTML = "";
            div.style.cursor = "default";
        }

        let matchTypeLabel = match.round === "GROUP" ? "Group Stage: Group " + match.group_name : (roundsMap[match.round] || match.round);

        let knockoutResHTML = "";
        if (match.team1_penalties !== null && match.team2_penalties !== null) {
            knockoutResHTML = `<div style="text-align: center; color: #ffbf00; font-size: 13px; font-weight: bold; margin-top: 5px;">Pens: ${match.team1_penalties} - ${match.team2_penalties}</div>`;
            if (match.toss_winner) {
                knockoutResHTML += `<div style="text-align: center; color: #ffbf00; font-size: 12px; margin-top: 2px;">Toss: ${match.toss_winner} won</div>`;
            }
        } else if (match.toss_winner) {
            knockoutResHTML = `<div style="text-align: center; color: #ffbf00; font-size: 13px; font-weight: bold; margin-top: 5px;">Toss Winner: ${match.toss_winner}</div>`;
        }

        div.innerHTML = `
            <div style="width: 100%;">
                <div class="teams" style="display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: bold;">
                    <div style="flex: 1; text-align: right; word-wrap: break-word;">${match.team1}</div>
                    <div style="margin: 0 15px; color: #d4ff00; white-space: nowrap;">${match.team1_score} - ${match.team2_score}</div>
                    <div style="flex: 1; text-align: left; word-wrap: break-word;">${match.team2}</div>
                </div>
                ${knockoutResHTML}
                <div class="match-time" style="text-align: center; font-size: 10px; color: #666; margin-top: 8px;">
                    ${matchTypeLabel} • FT • ${match.match_time ? formattedDate : ""}
                </div>
            </div>
            ${detailsHTML}
        `;

        if (hasDetails) {
            div.onclick = () => {
                const d = document.getElementById(`details-all-${match.id}`);
                d.style.display = d.style.display === "none" ? "block" : "none";
            };
        }

        container.appendChild(div);
    };

    if (groupedMatches.GROUP.length > 0) {
        groupedMatches.GROUP.forEach(renderCard);
    }

    ["PREQUARTER", "QUARTER", "SEMI", "FINAL"].forEach(r => {
        if (groupedMatches[r].length > 0) {
            const h2 = document.createElement("h2");
            h2.style.cssText = "width: 100%; text-align: center; color: #eaff00; font-family: 'Bebas Neue'; margin-top: 40px; margin-bottom: 20px; font-size: 32px; letter-spacing: 2px;";
            h2.innerText = roundsMap[r];
            container.appendChild(h2);
            groupedMatches[r].forEach(renderCard);
        }
    });
}

async function loadStats() {
    try {
        const pRes = await fetch(`${API}/players`);
        const players = await pRes.json();

        const topScorersGrid = document.getElementById("topGoalScorers");
        const topCsGrid = document.getElementById("topCleanSheets");
        if (!topScorersGrid || !topCsGrid) return;

        topScorersGrid.innerHTML = "";
        topCsGrid.innerHTML = "";

        const activeScorers = players.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5);
        const activeKeepers = players.filter(p => p.clean_sheets > 0).sort((a, b) => b.clean_sheets - a.clean_sheets).slice(0, 5);

        activeScorers.forEach((p, index) => {
            const div = document.createElement("div");
            div.className = "match-card";
            div.style.position = "relative";
            div.innerHTML = `
                <div style="position: absolute; top: -10px; left: -10px; background: #eaff00; color: #000; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; border: 2px solid #111;">${index + 1}</div>
                <div><span style="color:#ffffff; font-weight:bold; font-size: 18px;">${p.name}</span> <div style="font-size: 12px; color: #aaa;">${p.team_name}</div></div>
                <div style="font-size: 24px; font-weight: bold; color: #d4ff00;">${p.goals} <span style="font-size: 12px; font-weight: normal; opacity: 0.8;">Goals</span></div>
            `;
            topScorersGrid.appendChild(div);
        });

        activeKeepers.forEach((p, index) => {
            const div = document.createElement("div");
            div.className = "match-card";
            div.style.position = "relative";
            div.innerHTML = `
                <div style="position: absolute; top: -10px; left: -10px; background: #00eaff; color: #000; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; border: 2px solid #111;">${index + 1}</div>
                <div><span style="color:#ffffff; font-weight:bold; font-size: 18px;">${p.name}</span> <div style="font-size: 12px; color: #aaa;">${p.team_name}</div></div>
                <div style="font-size: 24px; font-weight: bold; color: #00eaff;">${p.clean_sheets} <span style="font-size: 12px; font-weight: normal; opacity: 0.8;">CS</span></div>
            `;
            topCsGrid.appendChild(div);
        });

    } catch (err) {
        console.error("Error loading player stats", err);
    }
}
