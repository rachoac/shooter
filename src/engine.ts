import Color from './color'
import Tile from './tile'
import Tree from './tree'
import Entity from './entity'
import Robot from './robot'
import TilesContainer from './tilescontainer'

export default class Engine {
    tilesContainer: TilesContainer
    score: number
    bombs: string[]
    player: Robot
    processing: any

    constructor(tilesContainer: TilesContainer, processing: any) {
        this.tilesContainer = tilesContainer;
        this.processing = processing
        this.score = 0;
        this.bombs = ['!', '!', '!'];

        this.mouseMovedHandling = this.mouseMovedHandling.bind(this)
        this.keyHandling = this.keyHandling.bind(this)
    }

    createPlayer() {
        let man = new Robot(this.processing, this, new Color(238, 255, 0, 255), 103, 3);
        man.setRole("player");
        this.tilesContainer.addTile(man);
        this.player = man;
        return man;
    }

    spawnZombie(speed: number) {
        let robot = new Robot( this.processing, this, new Color(255, 0, 0, 0), 103, speed);
        if (this.processing.random(0, 1) > 0.5) {
            robot.setPosition( this.processing.random(0, this.processing.width), this.processing.random(0, 1) > 0.5 ? -70 : this.processing.height+70 );
        } else {
            robot.setPosition( this.processing.random(0, 1) > 0.5 ? -70 : this.processing.width+70, this.processing.random(0, this.processing.height) );
        }
        robot.setRole("zombie");
        robot.setTargetEntity(this.player);
        this.tilesContainer.addTile(robot);
    }

    restart() {
        let processing = this.processing
        let robotCount = 6;
        let treeCount = 23;

        this.tilesContainer.restart()

        let man = this.createPlayer();
        man.setPosition(100, 100);

        // starting zombies
        for ( let i = 0; i < robotCount; i++ ) {
            this.spawnZombie(processing.random(0.1, 0.5));
        }

        // starting trees
        for ( let i = 0; i < treeCount; i++ ) {
            let tree = new Tree(processing, new Color(0, processing.random(100, 200), 0, 255), processing.random(50, 103));
            this.tilesContainer.addTile(tree);
            tree.setPosition(processing.random(0, processing.width), processing.random(0, processing.height));
        }
    }

    killedZombie(zombie:Entity) {
        // increase score
        this.score++;

        // remove self
        this.tilesContainer.removeTile(zombie);

        // spawn more fast zombies
        this.spawnZombie(zombie.speed + 0.1);

        if (this.processing.random(0, 1) > 0.8) {
            this.spawnZombie(0.1);
        }
    }

    damage(target: Tile) {
        this.tilesContainer.removeTile(target)
        if (target.id === this.player.id) {
            this.restart()
        }
    }

    keyHandling() {
        let keyCode = this.processing.keyCode
        let man = this.player;
        let x = man.x;
        let y = man.y;
        let speed = 15;

        if (keyCode === 38) {
            y -= speed;
        }
        if (keyCode === 40) {
            y += speed;
        }
        if (keyCode === 37) {
            x -= speed;
        }
        if (keyCode === 39) {
            x += speed;
        }

        let bulletSpeed = 8;

        if (keyCode === 87) {
            man.fireBullet(bulletSpeed, 0, -30, 0, -300);
        }
        if (keyCode === 83) {
            man.fireBullet(bulletSpeed, 0, 10, 0, 300);
        }
        if (keyCode === 65) {
            man.fireBullet(bulletSpeed, 0, -30, -300, -30);
        }
        if (keyCode === 68) {
            man.fireBullet(bulletSpeed, 0, -30, 300, -30);
        }

        if (keyCode === 32) {
            this.bombs.shift();
        }
        man.setTarget(x, y);
    }

    mouseMovedHandling() {
        let mouseX = this.processing.mouseX
        let mouseY = this.processing.mouseY
        let man = this.player;
        man.setTarget(mouseX, mouseY);
    }

    update() {
        let tilesContainer = this.tilesContainer;
        let tiles = tilesContainer.getTiles();
        let doSort = false;
        for ( let i = 0; i < tiles.length; i++ ) {
            let tile = tiles[i];

            if (tile && tile.update()) {
                doSort = true;
            }
        }
        if (doSort) {
            tilesContainer.sortTiles();
        }

        this.processing.background(0, 0, 0);

        for ( let i = 0; i < tiles.length; i++ ) {
            let tile = tiles[i];
            tile.render();
        }

        // score
        this.processing.fill(255, 0, 0);
        this.processing.text("Score " + this.score, 10, 30);

        this.processing.text(this.bombs.join(""), this.processing.width - 100, 30);
    }

    static initialize(processing: any) {
        let w  = window,
            d  = w.document,
            de = d.documentElement,
            db = d.body || d.getElementsByTagName('body')[0],
            x  = w.innerWidth || de.clientWidth || db.clientWidth,
            y  = w.innerHeight|| de.clientHeight|| db.clientHeight;

        processing.size(x,y);

        let tilesContainer = new TilesContainer();
        let engine = new Engine(tilesContainer, processing);

        processing.keyPressed = engine.keyHandling
        processing.mouseMoved = engine.mouseMovedHandling

        let f = processing.createFont("monospace", 30);
        processing.textFont(f)

        engine.restart()
        return engine
    }
}
