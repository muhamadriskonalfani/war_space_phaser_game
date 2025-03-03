class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' }); 
    }

    preload() {
        this.load.image('star', 'assets/img/star.png');
        this.load.image('ship', 'assets/img/ship.jpg');
    }

    create() {
        let stars = this.add.group();
        setInterval(() => {
            let randomY = Phaser.Math.Between(10, window.innerHeight - 10);
            let randomScale = Phaser.Math.FloatBetween(0.05, 0.2);
            let star = this.add.image(window.innerWidth, randomY, 'star');
            star.setScale(randomScale);
            star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.8));
            this.tweens.add({
                targets: star,
                x: -50,
                duration: Phaser.Math.Between(3000, 7000),
                onComplete: () => star.destroy()
            });
        }, 500);

        this.createUI(); 
        updateSizeDisplay(); 

        // Event untuk membersihkan elemen HTML saat scene ditutup
        this.events.on('shutdown', this.cleanup, this);
        this.events.on('destroy', this.cleanup, this);
    }

    createUI() {
        this.sizeDisplay = document.createElement('div');
        this.sizeDisplay.setAttribute('id', 'sizeDisplay');

        this.fullScreen = document.createElement('div');
        this.fullScreen.setAttribute('id', 'full-screen');
        this.fullScreen.innerHTML = '<i class="fas fa-expand"></i>';
        this.fullScreen.onclick = () => {
            toggleFullScreen();
        }

        this.gameContainer = document.createElement('div');
        this.gameContainer.setAttribute('id', 'container');

        let title = document.createElement("h1");
        title.textContent = "SPACE SHOOTER";
        title.classList.add("game-title");

        let ship = document.createElement("img");
        ship.src = "assets/img/ship.jpg";
        ship.classList.add("game-ship");

        let startButton = document.createElement("button");
        startButton.textContent = "Start Game";
        startButton.classList.add("start-button");
        startButton.onclick = () => {
            this.scene.start('GameScene');
        };

        document.body.appendChild(this.sizeDisplay);
        document.body.appendChild(this.fullScreen);
        document.body.appendChild(this.gameContainer);
        this.gameContainer.appendChild(title);
        this.gameContainer.appendChild(ship);
        this.gameContainer.appendChild(startButton);
    }

    cleanup() {
        // Hapus elemen-elemen HTML yang dibuat di MenuScene
        if (this.sizeDisplay) this.sizeDisplay.remove();
        if (this.fullScreen) this.fullScreen.remove();
        if (this.gameContainer) this.gameContainer.remove();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.ship = null;
        this.bullets = null;
        this.ufos = null;
        this.stars = null;
        this.shootSound = null;
        this.speed = 200;
        this.bulletSpeed = 400;
        this.bulletSize = 0.2;
        this.ufoSpeed = 150;
        this.shootingInterval = null;
        this.movingDirection = null;
        this.ufoScale = 0.11;
        this.totalUfos = 100;
        this.spawnedUfos = 0;
        this.destroyedUfos = 0;
        this.spawnInterval = null;
    }

    preload() {
        this.load.image('ship', 'assets/img/ship.jpg');
        this.load.image('bullet', 'assets/img/bullet.png');
        this.load.image('star', 'assets/img/star.png');
        this.load.audio('shootSound', 'assets/audio/pew-pew.mp3');
        for (let i = 1; i <= 9; i++) {
            this.load.image(`ufo${i}`, `assets/img/ufo${i}.png`);
        }
    }

    create() {
        this.ship = this.physics.add.sprite(100, this.cameras.main.height / 2, 'ship').setScale(0.5);
        this.ship.setCollideWorldBounds(true);
    
        this.bullets = this.physics.add.group();
        this.ufos = this.physics.add.group();
    
        this.shootSound = this.sound.add('shootSound');
    
        this.createUI(); // Akses fungsi lokal dengan 'this'
        this.addControlListeners(); 
        this.addShootListener(); 
        this.startSpawningUfos();  
        this.createStars(); 
        updateSizeDisplay(); // Akses fungsi global
    
        this.shootButton = document.querySelector('.x');
        this.physics.add.overlap(this.bullets, this.ufos, this.destroyUfo, null, this);
        this.physics.add.overlap(this.ship, this.ufos, this.gameOver, null, this);
    }    

    update() {
        if (this.movingDirection) {
            switch (this.movingDirection) {
                case 'up': this.ship.setVelocity(0, -this.speed); break;
                case 'down': this.ship.setVelocity(0, this.speed); break;
                case 'left': this.ship.setVelocity(-this.speed, 0); break;
                case 'right': this.ship.setVelocity(this.speed, 0); break;
            }
        } else {
            this.ship.setVelocity(0);
        }
    
        if (this.destroyedUfos === this.totalUfos) {
            this.moveShipToNextStage();
        }
    }    

    createUI() {
        // size display
        let sizeDisplay = document.createElement('div');
        sizeDisplay.setAttribute('id', 'sizeDisplay');

        // fullscreen button
        let fullScreen = document.createElement('div');
        fullScreen.setAttribute('id', 'full-screen');
        fullScreen.innerHTML = '<i class="fas fa-expand"></i>';
        fullScreen.onclick = () => {
            toggleFullScreen();
        }

        // Buat elemen controller-direction
        const controllerDirection = document.createElement('div');
        controllerDirection.classList.add('controller-direction');

        // Baris atas (tombol atas)
        const rowUp = document.createElement('div');
        rowUp.classList.add('row-x');
        const upButton = document.createElement('button');
        upButton.classList.add('up');
        const upImg = document.createElement('img');
        upImg.src = 'assets/img/up.jpg';
        upImg.alt = 'Up';
        upButton.appendChild(upImg);
        rowUp.appendChild(upButton);
        controllerDirection.appendChild(rowUp);

        // Baris tengah (tombol kiri dan kanan)
        const rowMiddle = document.createElement('div');
        rowMiddle.classList.add('row-x');

        const leftButton = document.createElement('button');
        leftButton.classList.add('left');
        const leftImg = document.createElement('img');
        leftImg.src = 'assets/img/left.jpg';
        leftImg.alt = 'Left';
        leftButton.appendChild(leftImg);

        const rightButton = document.createElement('button');
        rightButton.classList.add('right');
        const rightImg = document.createElement('img');
        rightImg.src = 'assets/img/right.jpg';
        rightImg.alt = 'Right';
        rightButton.appendChild(rightImg);

        rowMiddle.appendChild(leftButton);
        rowMiddle.appendChild(rightButton);
        controllerDirection.appendChild(rowMiddle);

        // Baris bawah (tombol bawah)
        const rowDown = document.createElement('div');
        rowDown.classList.add('row-x');
        const downButton = document.createElement('button');
        downButton.classList.add('down');
        const downImg = document.createElement('img');
        downImg.src = 'assets/img/down.jpg';
        downImg.alt = 'Down';
        downButton.appendChild(downImg);
        rowDown.appendChild(downButton);
        controllerDirection.appendChild(rowDown);

        document.body.appendChild(controllerDirection);

        // Buat elemen controller-action
        const controllerAction = document.createElement('div');
        controllerAction.classList.add('controller-action');

        const rowAction = document.createElement('div');
        rowAction.classList.add('row-x');

        const actionButton = document.createElement('button');
        actionButton.classList.add('x');
        const actionImg = document.createElement('img');
        actionImg.src = 'assets/img/x.jpg';
        actionImg.alt = 'Action';

        actionButton.appendChild(actionImg);
        rowAction.appendChild(actionButton);
        controllerAction.appendChild(rowAction);

        document.body.appendChild(controllerAction);
    }

    addControlListeners() {
        let controls = [
            { class: 'up', direction: 'up' },
            { class: 'down', direction: 'down' },
            { class: 'left', direction: 'left' },
            { class: 'right', direction: 'right' }
        ];

        controls.forEach(control => {
            let button = document.querySelector(`.${control.class}`);

            button.addEventListener('mousedown', () => { 
                this.movingDirection = control.direction; 
            });

            button.addEventListener('mouseup', () => { 
                this.movingDirection = null; 
            });

            button.addEventListener('touchstart', (event) => { 
                event.preventDefault();
                this.movingDirection = control.direction; 
            }, { passive: false });
            
            button.addEventListener('touchend', (event) => { 
                event.preventDefault();
                this.movingDirection = null; 
            }, { passive: false });            
        });

        // Tambahkan event listener untuk keyboard
        window.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        window.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });        
    }

    handleKeyDown(event) {
        if (event.key === 'ArrowUp' || event.key === 'w') this.movingDirection = 'up';
        if (event.key === 'ArrowDown' || event.key === 's') this.movingDirection = 'down';
        if (event.key === 'ArrowLeft' || event.key === 'a') this.movingDirection = 'left';
        if (event.key === 'ArrowRight' || event.key === 'd') this.movingDirection = 'right';
    }
    
    handleKeyUp(event) {
        if (['ArrowUp', 'w', 'ArrowDown', 's', 'ArrowLeft', 'a', 'ArrowRight', 'd'].includes(event.key)) {
            this.movingDirection = null;
        }
    }    

    addShootListener() {
        this.shootButton.addEventListener('mousedown', (event) => { event.preventDefault(); this.startShooting(); });
        this.shootButton.addEventListener('mouseup', (event) => { event.preventDefault(); this.stopShooting(); });
        this.shootButton.addEventListener('touchstart', (event) => { event.preventDefault(); this.startShooting(); });
        this.shootButton.addEventListener('touchend', (event) => { event.preventDefault(); this.stopShooting(); });

        // Tambahkan event listener untuk keyboard (Space dan Shift)
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                this.startShooting();
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.code === 'Space') {
                this.stopShooting();
            }
        });
    }

    startShooting() {
        if (!this.shootingInterval) {
            this.shootBullet();
            this.shootingInterval = setInterval(() => this.shootBullet(), 200);
        }
    }

    stopShooting() {
        clearInterval(this.shootingInterval);
        this.shootingInterval = null;
    }

    shootBullet() {
        this.shootSound.play();

        let bullet = this.bullets.create(this.ship.x + 30, this.ship.y, 'bullet');
        bullet.setVelocityX(this.bulletSpeed);
        bullet.setScale(this.bulletSize);
    }

    startSpawningUfos() {
        this.spawnInterval = setInterval(() => {
            if (this.spawnedUfos < totalUfos) {
                this.createUfo();
                this.spawnedUfos++;
            }

            if (this.spawnedUfos === totalUfos) {
                clearInterval(this.spawnInterval); // Hentikan spawn setelah semua UFO muncul
                
                // Setelah 6 detik, mulai gerakan ship ke kanan
                setTimeout(() => {
                    this.moveShipToNextStage();
                }, 6000);
            }
        }, 1000); // Munculkan 1 UFO setiap detik
    }

    createUfo() {
        let randomY = Phaser.Math.Between(50, window.innerHeight - 50);
        let randomType = Phaser.Math.Between(1, 9);
        
        let ufo = this.ufos.create(window.innerWidth, randomY, `ufo${randomType}`);
        ufo.setVelocityX(-this.ufoSpeed);
        ufo.setScale(this.ufoScale);

        ufo.setActive(true);
        ufo.setVisible(true);
        ufo.body.onWorldBounds = true;
        ufo.body.world.on('worldbounds', (body) => {
            if (body.gameObject === ufo) {
                ufo.destroy();
            }
        });
    }

    destroyUfo(bullet, ufo) {
        bullet.destroy();
        ufo.destroy();
        this.destroyedUfos++;
    }

    createStars() {
        this.stars = this.physics.add.group();

        // Tambahkan bintang baru setiap 500ms
        setInterval(() => {
            let randomY = Phaser.Math.Between(10, window.innerHeight - 10); // Posisi acak di layar
            let randomScale = Phaser.Math.FloatBetween(0.05, 0.2); // Ukuran acak bintang

            let star = this.stars.create(window.innerWidth, randomY, 'star');
            star.setVelocityX(-Phaser.Math.Between(50, 150)); // Kecepatan acak ke kiri
            star.setScale(randomScale);
            star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.8)); // Transparansi acak

            // Hapus bintang setelah keluar layar
            star.setCollideWorldBounds(false);
            star.checkWorldBounds = true;
            star.outOfBoundsKill = true;
        }, 500);
    }

    gameOver(ship, ufo) {
        this.shutdown();
        alert("Game Over! Pesawatmu tertabrak UFO.");
        this.scene.start('MenuScene');
    }

    moveShipToNextStage() {
        this.ship.body.checkWorldBounds = false;
        this.ship.body.setCollideWorldBounds(false);

        let speed = 200; // Kecepatan awal
        let acceleration = 20; // Tambahan kecepatan per interval

        let moveInterval = setInterval(() => {
            if (this.ship.x < window.innerWidth + 150) {
                speed += acceleration; // Tambah kecepatan
                this.ship.setVelocityX(speed); // Terapkan kecepatan baru
            } else {
                clearInterval(moveInterval);
                this.shutdown();
                alert("Berhasil!");
                window.location.href = "index.html";
            }
        }, 20); // Setiap 20ms kecepatan bertambah
    }

    shutdown() {
        // Hentikan interval jika ada
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
            this.shootingInterval = null;
        }
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }

        // Hapus semua sprite dan grup
        if (this.ship) this.ship.destroy();
        this.bullets.clear(true, true);
        this.ufos.clear(true, true);
        this.stars.clear(true, true);

        // Hapus event listener dari kontrol UI
        document.querySelector('.controller-direction')?.remove();
        document.querySelector('.controller-action')?.remove();

        // Hapus event listener dari keyboard
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);

        // Reset nilai-nilai penting
        this.movingDirection = null;
        this.spawnedUfos = 0;
        this.destroyedUfos = 0;
    }
}


// Main
let config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#111138',
    physics: { 
        default: 'arcade', 
        arcade: { debug: false } 
    },
    scene: [MenuScene, GameScene] 
};

let game = new Phaser.Game(config);


// Functions
function updateSizeDisplay() {
    document.getElementById('sizeDisplay').textContent = `${window.innerWidth} x ${window.innerHeight}`;
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            game.scale.resize(window.innerWidth, window.innerHeight);
            updateSizeDisplay();
        });
    } else {
        document.exitFullscreen().then(() => {
            game.scale.resize(window.innerWidth, window.innerHeight);
            updateSizeDisplay();
        });
    }
}

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
    updateSizeDisplay();
});
