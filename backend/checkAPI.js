async function check() {
    try {
        const res = await fetch("https://samba7s.onrender.com/matches");
        const matches = await res.json();
        console.log("First Match Sample:", matches[0]);
    } catch (err) {
        console.error(err);
    }
}
check();
