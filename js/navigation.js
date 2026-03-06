function openPage(page) {
    const target = document.getElementById(page);

    // If the element exists on the page, toggle its visibility (Single-Page App style)
    if (target) {
        document.querySelectorAll(".page").forEach(p => {
            p.style.display = "none";
        });
        target.style.display = "block";
    } else {
        // Otherwise, navigate strictly to the physical HTML file
        window.location.href = page + ".html";
    }
}
