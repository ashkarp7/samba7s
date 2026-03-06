const target = new Date("March 9, 2026 09:00:00").getTime();

const countdown = document.getElementById("countdown");

setInterval(() => {

    const now = new Date().getTime();

    const distance = target - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    countdown.innerHTML =
        `${days}d ${hours}h ${minutes}m`;

}, 1000);
