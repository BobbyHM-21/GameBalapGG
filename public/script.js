const socket = io();

const player = document.getElementById('player');
const gameArea = document.getElementById('game');

function movePlayer(x, y) {
    player.style.transform = `translate(${x}px, ${y}px)`;
}

document.addEventListener('mousemove', (event) => {
    movePlayer(event.clientX - 25, event.clientY - 25);
});

// Optionally, you can add animations or other interactive features here
