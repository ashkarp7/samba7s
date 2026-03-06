function showSection(sectionId) {

    const sections = document.querySelectorAll(".section");

    sections.forEach(section => {
        section.style.display = "none";
    });

    document.getElementById(sectionId).style.display = "block";

    if (sectionId === 'standings' && window.reloadAdminStandings) {
        window.reloadAdminStandings();
    }

    if (sectionId === 'stats' && window.reloadAdminStats) {
        window.reloadAdminStats();
    }
}
