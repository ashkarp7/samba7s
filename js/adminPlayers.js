async function loadRosterTeams() {
    try {
        const teams = await getTeams();
        const sel = document.getElementById("playerTeamSelect");
        if (!sel) return;

        sel.innerHTML = '<option value="">Select Team</option>';
        teams.forEach(team => {
            const opt = document.createElement("option");
            opt.value = team.id;
            opt.textContent = `${team.name} (Group ${team.group_name})`;
            sel.appendChild(opt);
        });
    } catch (err) {
        console.error("Failed loading teams for players", err);
    }
}

async function loadPlayersForTeam() {
    const team_id = document.getElementById("playerTeamSelect").value;
    const list = document.getElementById("playerRosterList");
    list.innerHTML = "";

    if (!team_id) return;

    try {
        const res = await fetch(`${API}/players?team_id=${team_id}`);
        const players = await res.json();

        if (players.length === 0) {
            list.innerHTML = "<li>No players on this roster yet.</li>";
            return;
        }

        players.forEach(p => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.marginBottom = "10px";

            li.innerHTML = `
                <span><strong>${p.name}</strong> 
                <small style="color: #ccc; margin-left: 10px;">Goals: ${p.goals} | CS: ${p.clean_sheets}</small></span>
                <div>
                    <button onclick="editPlayer(${p.id}, '${p.name.replace(/'/g, "\\'")}')" style="padding: 5px 10px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
                    <button onclick="removePlayer(${p.id})" style="padding: 5px 10px; background: #ff4d4d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 5px;">Remove</button>
                </div>
            `;
            list.appendChild(li);
        });

        const countDiv = document.createElement("div");
        countDiv.innerHTML = `<em>Roster Size: ${players.length} / 12</em>`;
        countDiv.style.marginTop = "20px";
        countDiv.style.color = players.length >= 12 ? "#ff4d4d" : "#eaff00";
        list.appendChild(countDiv);

    } catch (err) {
        console.error("Error loading players", err);
    }
}

async function addPlayer() {
    const name = document.getElementById("newPlayerName").value.trim();
    const team_id = document.getElementById("playerTeamSelect").value;

    if (!name || !team_id) {
        alert("Please select a team and enter a player name.");
        return;
    }

    try {
        const res = await fetch(`${API}/players`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, team_id })
        });

        if (res.ok) {
            document.getElementById("newPlayerName").value = "";
            loadPlayersForTeam();
        } else {
            const errBody = await res.json();
            alert(errBody.error || "Failed to add player");
        }
    } catch (err) {
        console.error(err);
        alert("Server error adding player.");
    }
}

async function removePlayer(id) {
    if (!confirm("Remove this player?")) return;

    try {
        const res = await fetch(`${API}/players/${id}`, { method: "DELETE" });
        if (res.ok) {
            loadPlayersForTeam();
        }
    } catch (err) {
        console.error(err);
    }
}

// Global initialization
if (document.getElementById("playerTeamSelect")) {
    loadRosterTeams();
}

async function editPlayer(id, currentName) {
    const newName = prompt("Enter new player name:", currentName);
    if (!newName || newName.trim() === "" || newName === currentName) return;

    try {
        const res = await fetch(`${API}/players/${id}/name`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim() })
        });
        if (res.ok) {
            loadPlayersForTeam();
        } else {
            alert("Failed to update player name");
        }
    } catch (err) {
        console.error("Error editing player name", err);
    }
}
