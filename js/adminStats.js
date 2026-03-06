async function loadStatsTeams() {
    try {
        const teams = await getTeams();
        const sel = document.getElementById("statsTeamSelect");
        if (!sel) return;

        sel.innerHTML = '<option value="">Select Team</option>';
        teams.forEach(team => {
            const opt = document.createElement("option");
            opt.value = team.id;
            opt.textContent = `${team.name} (Group ${team.group_name})`;
            sel.appendChild(opt);
        });
    } catch (err) {
        console.error("Failed loading teams for stats", err);
    }
}

async function loadPlayerStatsForTeam() {
    const team_id = document.getElementById("statsTeamSelect").value;
    const container = document.getElementById("statsPlayerContainer");
    container.innerHTML = "";

    if (!team_id) return;

    try {
        const res = await fetch(`${API}/players?team_id=${team_id}`);
        const players = await res.json();

        if (players.length === 0) {
            container.innerHTML = "<p style='color: #ccc;'>No players on this team. Add them in the Players tab.</p>";
            return;
        }

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.textAlign = "center";
        table.style.marginTop = "20px";

        table.innerHTML = `
            <thead>
                <tr style="background: #111; color: #eaff00;">
                    <th style="padding: 10px; text-align: left;">Player</th>
                    <th style="padding: 10px; width: 100px;">Goals</th>
                    <th style="padding: 10px; width: 100px;">Clean Sheets</th>
                    <th style="padding: 10px; width: 80px;">Action</th>
                </tr>
            </thead>
            <tbody>
                ${players.map(p => `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 10px; text-align: left; font-weight: bold;">${p.name}</td>
                        <td style="padding: 5px;"><input id="g_${p.id}" type="number" value="${p.goals}" style="width: 100%; padding: 5px; text-align: center; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></td>
                        <td style="padding: 5px;"><input id="cs_${p.id}" type="number" value="${p.clean_sheets}" style="width: 100%; padding: 5px; text-align: center; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></td>
                        <td style="padding: 5px;"><button onclick="savePlayerStats(${p.id})" style="padding: 5px 10px; background: #eaff00; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Save</button></td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        container.appendChild(table);

    } catch (err) {
        console.error("Error loading player stats", err);
    }
}

async function savePlayerStats(id) {
    const goals = parseInt(document.getElementById(`g_${id}`).value, 10);
    const clean_sheets = parseInt(document.getElementById(`cs_${id}`).value, 10);

    try {
        const res = await fetch(`${API}/players/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goals, clean_sheets })
        });

        if (res.ok) {
            alert("Player stats updated!");
        } else {
            alert("Error updating player stats.");
        }
    } catch (err) {
        alert("Server communication error.");
        console.error(err);
    }
}

// Global initialization
if (document.getElementById("statsTeamSelect")) {
    loadStatsTeams();
}

// Expose reload function to admin.js section toggler if it needs refreshing
window.reloadAdminStats = loadStatsTeams;
