async function loadTeams() {

    const teams = await getTeams();

    const list = document.getElementById("teamList");
    list.innerHTML = "";

    teams.forEach(team => {

        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.gap = "10px";
        li.style.alignItems = "center";
        li.style.marginBottom = "10px";

        li.innerHTML = `
            <span style="flex-grow: 1;">${team.name}</span>
            <button onclick="editTeam(${team.id}, '${team.name.replace(/'/g, "\\'")}')\" style="padding: 5px 10px; background: #555; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Edit</button>
            <button onclick="removeTeam(${team.id})" style="padding: 5px 10px; background: #ff4d4d; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
        `;

        list.appendChild(li);

    });

}

async function createTeam() {

    const name = document.getElementById("teamName").value;

    await addTeam(name);

    loadTeams();

}

async function removeTeam(id) {
    await deleteTeam(id);
    loadTeams();
}

loadTeams();

function logout() {

    localStorage.removeItem("adminLoggedIn");

    window.location.href = "login.html";

}

async function editTeam(id, currentName) {
    const newName = prompt("Enter new team name:", currentName);
    if (!newName || newName.trim() === "" || newName === currentName) return;

    try {
        const res = await fetch(`${API}/teams/${id}/name`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim() })
        });
        if (res.ok) {
            loadTeams();
        } else {
            alert("Failed to update team name");
        }
    } catch (err) {
        console.error("Error editing team name", err);
    }
}
