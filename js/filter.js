function filterGroup(group) {

    const matches = document.querySelectorAll(".match-card");

    matches.forEach(match => {

        if (group === "all") {
            match.style.display = "block";
        }
        else {

            if (match.dataset.group === group) {
                match.style.display = "block";
            }
            else {
                match.style.display = "none";
            }

        }

    });

}
