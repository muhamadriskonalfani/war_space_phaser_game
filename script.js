let config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#111138',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: { preload, create, update }
};

let ship, bullets, ufos, stars;
let shootSound;
let speed = 200;
let bulletSpeed = 400;
let bulletSize = 0.2;
let ufoSpeed = 150;
let shootingInterval = null;
let game = new Phaser.Game(config);
let movingDirection = null;
let ufoScale = 0.11;

// Jumlah total UFO yang akan muncul
let totalUfos = 100;
let spawnedUfos = 0;
let destroyedUfos = 0;
let spawnInterval = null;

function preload() {
    this.load.image('ship', 'assets/img/ship.jpg');
    this.load.image('bullet', 'assets/img/bullet.png');
    this.load.image('star', 'assets/img/star.png');
    this.load.audio('shootSound', 'assets/audio/pew-pew.mp3');

    for (let i = 1; i <= 9; i++) {
        this.load.image(`ufo${i}`, `assets/img/ufo${i}.png`);
    }
}

function create() {
    ship = this.physics.add.sprite(100, this.cameras.main.height / 2, 'ship').setScale(0.5);
    ship.setCollideWorldBounds(true);

    bullets = this.physics.add.group();
    ufos = this.physics.add.group();

    shootSound = this.sound.add('shootSound');

    addControlListeners();
    addShootListener();
    startSpawningUfos();  // Mulai memunculkan UFO
    createStars.call(this);
    updateSizeDisplay();

    this.physics.add.overlap(bullets, ufos, destroyUfo, null, this);
    this.physics.add.overlap(ship, ufos, gameOver, null, this);
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

    if (destroyedUfos === totalUfos) {
        moveShipToNextStage();
    }
}

// === Kontrol Pesawat ===
function addControlListeners() {
    let controls = [
        { class: 'up', direction: 'up' },
        { class: 'down', direction: 'down' },
        { class: 'left', direction: 'left' },
        { class: 'right', direction: 'right' }
    ];

    controls.forEach(control => {
        let button = document.querySelector(`.${control.class}`);

        button.addEventListener('mousedown', () => { movingDirection = control.direction; });
        button.addEventListener('mouseup', () => { movingDirection = null; });

        button.addEventListener('touchstart', (event) => { 
            event.preventDefault(); 
            movingDirection = control.direction; 
        });

        button.addEventListener('touchend', (event) => { 
            event.preventDefault(); 
            movingDirection = null; 
        });
    });

    // Tambahkan event listener untuk keyboard
    window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp' || event.key === 'w') movingDirection = 'up';
        if (event.key === 'ArrowDown' || event.key === 's') movingDirection = 'down';
        if (event.key === 'ArrowLeft' || event.key === 'a') movingDirection = 'left';
        if (event.key === 'ArrowRight' || event.key === 'd') movingDirection = 'right';
    });

    window.addEventListener('keyup', (event) => {
        if (['ArrowUp', 'w', 'ArrowDown', 's', 'ArrowLeft', 'a', 'ArrowRight', 'd'].includes(event.key)) {
            movingDirection = null; // Hentikan pergerakan saat tombol dilepas
        }
    });
}

// === Kontrol Tembakan ===
function addShootListener() {
    let shootButton = document.querySelector('.x');

    shootButton.addEventListener('mousedown', (event) => { event.preventDefault(); startShooting(); });
    shootButton.addEventListener('mouseup', (event) => { event.preventDefault(); stopShooting(); });
    shootButton.addEventListener('touchstart', (event) => { event.preventDefault(); startShooting(); });
    shootButton.addEventListener('touchend', (event) => { event.preventDefault(); stopShooting(); });

    // Tambahkan event listener untuk keyboard (Space dan Shift)
    window.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            startShooting();
        }
    });

    window.addEventListener('keyup', (event) => {
        if (event.code === 'Space') {
            stopShooting();
        }
    });
}

function startShooting() {
    if (!shootingInterval) {
        shootBullet();
        shootingInterval = setInterval(shootBullet, 200);
    }
}

function stopShooting() {
    clearInterval(shootingInterval);
    shootingInterval = null;
}

function shootBullet() {
    shootSound.play();

    let bullet = bullets.create(ship.x + 30, ship.y, 'bullet');
    bullet.setVelocityX(bulletSpeed);
    bullet.setScale(bulletSize);
}

// === Fungsi Spawn UFO ===
function startSpawningUfos() {
    spawnInterval = setInterval(() => {
        if (spawnedUfos < totalUfos) {
            createUfo();
            spawnedUfos++;
        } 
        
        if (spawnedUfos === totalUfos) {
            clearInterval(spawnInterval); // Hentikan spawn setelah semua UFO muncul
            
            // Setelah 10 detik, mulai gerakan ship ke kanan
            setTimeout(() => {
                moveShipToNextStage();
            }, 6000);
        }
    }, 1000); // Munculkan 1 UFO setiap detik
}

function createUfo() {
    let randomY = Phaser.Math.Between(50, window.innerHeight - 50);
    let randomType = Phaser.Math.Between(1, 9);
    
    let ufo = ufos.create(window.innerWidth, randomY, `ufo${randomType}`);
    ufo.setVelocityX(-ufoSpeed);
    ufo.setScale(ufoScale);

    ufo.setActive(true);
    ufo.setVisible(true);
    ufo.body.onWorldBounds = true;
    ufo.body.world.on('worldbounds', (body) => {
        if (body.gameObject === ufo) {
            ufo.destroy();
        }
    });
}

// === Fungsi Menghancurkan UFO ===
function destroyUfo(bullet, ufo) {
    bullet.destroy();
    ufo.destroy();
    destroyedUfos++;
}

function createStars() {
    stars = this.physics.add.group();

    // Tambahkan bintang baru setiap 500ms
    setInterval(() => {
        let randomY = Phaser.Math.Between(10, window.innerHeight - 10); // Posisi acak di layar
        let randomScale = Phaser.Math.FloatBetween(0.05, 0.2); // Ukuran acak bintang

        let star = stars.create(window.innerWidth, randomY, 'star');
        star.setVelocityX(-Phaser.Math.Between(50, 150)); // Kecepatan acak ke kiri
        star.setScale(randomScale);
        star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.8)); // Transparansi acak

        // Hapus bintang setelah keluar layar
        star.setCollideWorldBounds(false);
        star.checkWorldBounds = true;
        star.outOfBoundsKill = true;
    }, 500);
}

// === Fungsi Game Over ===
function gameOver(ship, ufo) {
    ship.destroy();
    alert("Game Over! Pesawatmu tertabrak UFO.");
    this.scene.restart();
    window.location.href = "index.html";
}

// === Fungsi Ship Pergi ke Stage Berikutnya ===
function moveShipToNextStage() {
    ship.body.checkWorldBounds = false; 
    ship.body.setCollideWorldBounds(false);

    let speed = 200; // Kecepatan awal
    let acceleration = 20; // Tambahan kecepatan per interval

    let moveInterval = setInterval(() => {
        if (ship.x < window.innerWidth + 150) {
            speed += acceleration; // Tambah kecepatan
            ship.setVelocityX(speed); // Terapkan kecepatan baru
        } else {
            clearInterval(moveInterval);
            ship.destroy();
            alert("Berhasil!");
            window.location.href = "index.html";
        }
    }, 20); // Setiap 20ms kecepatan bertambah
}

// === Fungsi Ukuran Layar ===
function updateSizeDisplay() {
    document.getElementById('sizeDisplay').textContent = `${window.innerWidth} x ${window.innerHeight}`;
}

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
    updateSizeDisplay();
});

document.getElementById('full-screen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            game.scale.resize(window.innerWidth, window.innerHeight);
            game.scene.scenes[0].physics.world.setBounds(0, 0, window.innerWidth, window.innerHeight);
            updateSizeDisplay();
        });
    } else {
        document.exitFullscreen().then(() => {
            game.scale.resize(window.innerWidth, window.innerHeight);
            game.scene.scenes[0].physics.world.setBounds(0, 0, window.innerWidth, window.innerHeight);
            updateSizeDisplay();
        });
    }
});
