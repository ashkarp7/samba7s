async function loadAdminStandingsTables() {
    try {
        const res = await fetch(`${API}/standings`);
        const standings = await res.json();

        const container = document.getElementById("adminStandingsTables");
        if (!container) return;

        container.innerHTML = "";

        const tableDiv = document.createElement("div");
        tableDiv.style.marginBottom = "30px";
        tableDiv.innerHTML = `
            <h3 style="color: #eaff00; margin-bottom: 10px;">All Teams</h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: center; background: rgba(255,255,255,0.05);">
                    <thead>
                        <tr style="background: #111; color: #eaff00;">
                            <th style="padding: 10px; width: 40px;">Pos</th>
                            <th style="padding: 10px; text-align: left;">Team</th>
                            <th style="padding: 10px; width: 60px;">P</th>
                            <th style="padding: 10px; width: 60px;">W</th>
                            <th style="padding: 10px; width: 60px;">D</th>
                            <th style="padding: 10px; width: 60px;">L</th>
                            <th style="padding: 10px; width: 60px;">GF</th>
                            <th style="padding: 10px; width: 60px;">GA</th>
                            <th style="padding: 10px; width: 60px;">GD</th>
                            <th style="padding: 10px; width: 60px;">PTS</th>
                            <th style="padding: 10px; width: 60px;">Order</th>
                            <th style="padding: 10px; width: 80px;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${standings.length === 0 ? `<tr><td colspan="12" style="padding: 10px; text-align: center; opacity: 0.5;">No teams yet</td></tr>` :
                standings.map((t, index) => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                                    <td style="padding: 10px; font-weight: bold; color: #888;">${index + 1}</td>
                                    <td style="padding: 10px; text-align: left; font-weight: bold;">${t.name}</td>
                                    <td style="padding: 5px;"><input id="p_${t.team_id}" type="number" value="${t.played}" style="width: 100%; padding: 5px; text-align: center; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></td>
                                    <td style="padding: 5px;"><input id="w_${t.team_id}" type="number" value="${t.wins}" style="width: 100%; padding: 5px; text-align: center; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></td>
                                    <td style="padding: 5px;"><input id="d_${t.team_id}" type="number" value="${t.draws}" style="width: 100%; padding: 5px; text-align: center; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></td>
                                    <td style="padding: 5px;"><input id="l_${t.team_id}" type="number" value="${t.losses}" style="width: 100%; padding: 5px; text-align: center; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></td>
                                    <td style="padding: 5px;"><input id="gf_${t.team_id}" type="number" value="${t.goals_for}" style="width: 100%; padding: 5px; text-align: center; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></td>
                                    <td style="padding: 5px;"><input id="ga_${t.team_id}" type="number" value="${t.goals_against}" style="width: 100%; padding: 5px; text-align: center; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></td>
                                    <td style="padding: 5px;"><input id="gd_${t.team_id}" type="number" value="${t.goal_diff}" style="width: 100%; padding: 5px; text-align: center; background: #222; color: white; border: 1px solid #444; border-radius: 4px;"></td>
                                    <td style="padding: 5px;"><input id="pts_${t.team_id}" type="number" value="${t.points}" style="width: 100%; padding: 5px; text-align: center; background: #eaff00; color: black; border: 1px solid #eaff00; border-radius: 4px; font-weight: bold;"></td>
                                    <td style="padding: 5px;"><input id="ord_${t.team_id}" type="number" value="${t.manual_position || 0}" style="width: 100%; padding: 5px; text-align: center; background: #222; color: #eaff00; border: 1px solid #444; border-radius: 4px;"></td>
                                    <td style="padding: 5px;"><button onclick="saveStandingsRow(${t.team_id})" style="padding: 5px 10px; background: #eaff00; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Save</button></td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.appendChild(tableDiv);
    } catch (err) {
        console.error("Error loading admin standings tables:", err);
    }
}

async function saveStandingsRow(team_id) {
    const payload = {
        played: parseInt(document.getElementById(`p_${team_id}`).value, 10),
        wins: parseInt(document.getElementById(`w_${team_id}`).value, 10),
        draws: parseInt(document.getElementById(`d_${team_id}`).value, 10),
        losses: parseInt(document.getElementById(`l_${team_id}`).value, 10),
        goals_for: parseInt(document.getElementById(`gf_${team_id}`).value, 10),
        goals_against: parseInt(document.getElementById(`ga_${team_id}`).value, 10),
        goal_diff: parseInt(document.getElementById(`gd_${team_id}`).value, 10),
        points: parseInt(document.getElementById(`pts_${team_id}`).value, 10),
        manual_position: parseInt(document.getElementById(`ord_${team_id}`).value, 10)
    };

    try {
        const res = await fetch(`${API}/standings/${team_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Team stats updated and synced!");
            loadAdminStandingsTables();
        } else {
            alert("Error updating team stats.");
        }
    } catch (err) {
        alert("Server communication error.");
        console.error(err);
    }
}

// Global initialization
if (document.getElementById("adminStandingsTables")) {
    loadAdminStandingsTables();
}

// Expose reload function to admin.js section toggler if it needs refreshing
window.reloadAdminStandings = loadAdminStandingsTables;
