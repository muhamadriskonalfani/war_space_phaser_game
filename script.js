let config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#111138',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: { preload, create, update }
};

let ship;
let speed = 200;
let game = new Phaser.Game(config);
let movingDirection = null;

function preload() {
    this.load.image('ship', 'ship.jpg');
}

function create() {
    ship = this.physics.add.sprite(this.cameras.main.width / 2, this.cameras.main.height / 2, 'ship').setScale(0.5);
    ship.setCollideWorldBounds(true);
    addControlListeners();
    updateSizeDisplay();
}

function update() {
    if (movingDirection) {
        switch (movingDirection) {
            case 'up': ship.setVelocity(0, -speed); break;
            case 'down': ship.setVelocity(0, speed); break;
            case 'left': ship.setVelocity(-speed, 0); break;
            case 'right': ship.setVelocity(speed, 0); break;
        }
    } else {
        ship.setVelocity(0);
    }
    ship.setFlipX(false);
}

function addControlListeners() {
    let controls = [
        { class: 'up', direction: 'up' },
        { class: 'down', direction: 'down' },
        { class: 'left', direction: 'left' },
        { class: 'right', direction: 'right' }
    ];

    controls.forEach(control => {
        let button = document.querySelector(`.${control.class}`);

        button.addEventListener('mousedown', (event) => {
            movingDirection = control.direction;
        });

        button.addEventListener('mouseup', () => {
            movingDirection = null;
        });

        button.addEventListener('touchstart', (event) => {
            event.preventDefault(); // Mencegah popup saat tombol ditahan
            movingDirection = control.direction;
        });

        button.addEventListener('touchend', (event) => {
            event.preventDefault(); // Mencegah popup saat tombol dilepas
            movingDirection = null;
        });
    });
}

function updateSizeDisplay() {
    document.getElementById('sizeDisplay').textContent = `${window.innerWidth} x ${window.innerHeight}`;
}

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
    updateSizeDisplay();
});

document.getElementById('full-screen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});
