const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let car;
let cursors;
let background;
let obstacles;
let score = 0;
let highscore = 0;
let scoreText;
let highscoreText;
let gameOver = false;
let obstacleSpeed = 200;
let obstacleSpawnRate = 2000;
let nextObstacleTime = 0;
let speedIncreaseInterval = 30000; // 30 seconds
let lastSpeedIncreaseTime = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchMoveX = 0;
let touchMoveY = 0;

function preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('car', 'assets/car.png');
    this.load.image('obstacle1', 'assets/obstacle1.png');
    this.load.image('obstacle2', 'assets/obstacle2.png');
    this.load.image('obstacle3', 'assets/obstacle3.png');
}

function create() {
    // Inisialisasi background, mobil, dan obstacle
    background = this.add.tileSprite(0, 0, config.width, config.height, 'background');
    background.setOrigin(0, 0);

    car = this.physics.add.image(config.width / 2, config.height - 150, 'car');
    car.setCollideWorldBounds(true);
    car.setDisplaySize(100, 50);

    obstacles = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        defaultKey: 'obstacle1',
        maxSize: 10,
        runChildUpdate: true
    });

    this.physics.add.collider(car, obstacles, hitObstacle, null, this);

    cursors = this.input.keyboard.createCursorKeys();

    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#fff'
    });

    highscoreText = this.add.text(16, 50, 'Highscore: 0', {
        fontSize: '32px',
        fill: '#fff'
    });

    this.input.on('pointerdown', onPointerDown, this);
    this.input.on('pointermove', onPointerMove, this);

    fetch('/highscore')
        .then(response => response.json())
        .then(data => {
            highscore = data.highscore;
            highscoreText.setText('Highscore: ' + highscore);
        });
}

function update(time, delta) {
    if (gameOver) {
        return;
    }

    background.tilePositionY -= 2;

    if (cursors.left.isDown || touchMoveX < touchStartX) {
        car.setVelocityX(-160);
    } else if (cursors.right.isDown || touchMoveX > touchStartX) {
        car.setVelocityX(160);
    } else {
        car.setVelocityX(0);
    }

    if (cursors.up.isDown) {
        car.setVelocityY(-160);
    } else if (cursors.down.isDown) {
        car.setVelocityY(160);
    } else {
        car.setVelocityY(0);
    }

    if (time > nextObstacleTime) {
        spawnObstacle();
        nextObstacleTime = time + obstacleSpawnRate;
    }

    obstacles.children.iterate(function (child) {
        if (child.y > config.height) {
            child.setActive(false);
            child.setVisible(false);
            score += 10;
            scoreText.setText('Score: ' + score);
        }
    });

    if (time > lastSpeedIncreaseTime + speedIncreaseInterval) {
        obstacleSpeed += 20;
        obstacleSpawnRate = Math.max(500, obstacleSpawnRate - 100);
        lastSpeedIncreaseTime = time;
    }
}

function spawnObstacle() {
    let obstacleType = Phaser.Math.Between(1, 3); // 1, 2, atau 3
    let obstacleKey = 'obstacle' + obstacleType;
    let obstacleWidth = Phaser.Math.Between(50, 200);
    let obstacleHeight = Phaser.Math.Between(50, 200);
    let obstacle = obstacles.get(Phaser.Math.Between(0, config.width - obstacleWidth), -obstacleHeight, obstacleKey);

    if (obstacle) {
        obstacle.setActive(true);
        obstacle.setVisible(true);
        obstacle.setSize(obstacleWidth, obstacleHeight, true);
        obstacle.setDisplaySize(obstacleWidth, obstacleHeight);
        obstacle.setVelocityY(obstacleSpeed);
    }
}

function hitObstacle(car, obstacle) {
    car.setTint(0xff0000);
    gameOver = true;

    const modal = document.createElement('div');
    modal.className = 'modal';
    let leaderboardHTML = `
        <h2>Game Over</h2>
        <p>Score: ${score}</p>
        <p>Highscore: ${highscore}</p>
        <button id="retryButton">Retry</button>
    `;

    fetch('/leaderboard')
        .then(response => response.json())
        .then(data => {
            if (data.leaderboard.length > 0) {
                leaderboardHTML += '<h3>Leaderboard</h3><ul>';
                data.leaderboard.forEach(entry => {
                    leaderboardHTML += `<li>Score: ${entry.score}</li>`;
                });
                leaderboardHTML += '</ul>';
            } else {
                leaderboardHTML += '<p>No leaderboard data available.</p>';
            }
            modal.innerHTML = leaderboardHTML;
            document.body.appendChild(modal);

            document.getElementById('retryButton').addEventListener('click', () => {
                document.body.removeChild(modal);
                restartGame();
            });

            if (score > highscore) {
                highscore = score;
                highscoreText.setText('Highscore: ' + highscore);

                fetch('/highscore', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ highscore: highscore })
                });
            }
        });

    obstacles.children.iterate(function (child) {
        child.setVelocityY(0);
    });

    background.setTilePositionY(0);
}

function restartGame() {
    gameOver = false;
    score = 0;
    scoreText.setText('Score: 0');
    obstacles.children.iterate(function (child) {
        child.setActive(false);
        child.setVisible(false);
    });
}

function onPointerDown(pointer) {
    touchStartX = pointer.x;
    touchStartY = pointer.y;
}

function onPointerMove(pointer) {
    touchMoveX = pointer.x;
    touchMoveY = pointer.y;
}

