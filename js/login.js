function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "admin" && password === "samba123") {

        localStorage.setItem("adminLoggedIn", "true");

        window.location.href = "admin.html";

    }
    else {

        document.getElementById("error").innerText = "Invalid login";

    }

}
