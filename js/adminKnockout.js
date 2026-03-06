async function loadKnockoutTeams() {
    const teams = await getTeams();

    const t1 = document.getElementById("koTeam1");
    const t2 = document.getElementById("koTeam2");

    if (!t1 || !t2) return;

    t1.innerHTML = "";
    t2.innerHTML = "";

    teams.forEach(team => {
        const opt1 = document.createElement("option");
        opt1.value = team.id;
        opt1.textContent = team.name;

        const opt2 = opt1.cloneNode(true);

        t1.appendChild(opt1);
        t2.appendChild(opt2);
    });
}

async function loadKnockout() {
    const matches = await getMatches();
    const list = document.getElementById("knockoutList");

    if (!list) return;

    list.innerHTML = "";

    matches
        .filter(m => m.round !== "GROUP")
        .forEach(match => {
            const li = document.createElement("li");

            li.innerHTML = `
                ${match.round} : ${match.team1} vs ${match.team2}
                <button onclick="removeKnockout(${match.id})">Delete</button>
            `;

            list.appendChild(li);
        });
}

async function removeKnockout(id) {
    await deleteMatch(id);
    loadKnockout();
}

async function createKnockout() {
    const team1 = document.getElementById("koTeam1").value;
    const team2 = document.getElementById("koTeam2").value;
    const round = document.getElementById("koRound").value;
    const time = document.getElementById("koTime").value;

    await createMatch(team1, team2, "KNOCKOUT", round, time);

    loadKnockout();
}

loadKnockoutTeams();
loadKnockout();
