import Color from './color'
import Tile from './tile'
import Tree from './tree'
import Entity from './entity'
import Avatar from './avatar'
import TilesContainer from './tilescontainer'
import Bullet from "./bullet";
import Explosion from "./explosion";

interface Client {
    send(value: string): void
}

export default class Engine {
    tilesContainer: TilesContainer
    score: number
    bombs: string[]
    player: Avatar
    processing: any
    private client: Client
    sessionID: number

    constructor(tilesContainer: TilesContainer, processing: any) {
        this.tilesContainer = tilesContainer;
        this.processing = processing
        this.score = 0;
        this.bombs = ['!', '!', '!'];

        this.mouseMovedHandling = this.mouseMovedHandling.bind(this)
        this.keyHandling = this.keyHandling.bind(this)
    }

    updatePosition(entity: Entity, newX: number, newY: number) {
        entity.setPosition(newX, newY)
    }

    restart() {
        this.tilesContainer.restart()
    }

    killedZombie(zombie:Entity) {
        // increase score
        this.score++;

        // remove self
        this.tilesContainer.removeTile(zombie);
    }

    damage(target: Tile) {
        this.tilesContainer.removeTile(target)
        if (target.id === this.player.id) {
            this.restart()
        }
    }

    fireBullet(speed: number, xOffsetStart: number, yOffsetStart: number, xOffsetEnd: number, yOffsetEnd: number) {
        let man = this.player;
        let x = man.x + xOffsetStart
        let y = man.y + yOffsetStart
        let targetX = man.x + xOffsetEnd
        let targetY = man.y + yOffsetEnd

        this.client.send(`F:${x}:${y}:${targetX}:${targetY}:${speed}:${man.id}`)
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

        let bulletSpeed = 12;

        if (keyCode === 87) {
            this.fireBullet(bulletSpeed, 0, -30, 0, -300);
        }
        if (keyCode === 83) {
            this.fireBullet(bulletSpeed, 0, 10, 0, 300);
        }
        if (keyCode === 65) {
            this.fireBullet(bulletSpeed, 0, -30, -300, -30);
        }
        if (keyCode === 68) {
            this.fireBullet(bulletSpeed, 0, -30, 300, -30);
        }

        if (keyCode === 32) {
            this.bombs.shift();
        }
        // man.setTarget(x, y);
    }

    mouseMovedHandling() {
        let mouseX = this.processing.mouseX
        let mouseY = this.processing.mouseY
        if (this.sessionID) {
            this.client.send(`T:${this.sessionID}:${mouseX}:${mouseY}`)
        }
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

    onSocketClose(evt: any) {
        console.log("Close!", evt)
    }

    onSocketMessage(evt: any) {
        let messages = evt.data.split("\n")
        messages.forEach( (m: string) => {
            let opCode, data
            [opCode, ...data] = m.split(":")

            switch(opCode) {
                case 'ID': this.handleID(data); break;
                case 'M': this.handleMove(data); break;
                case 'N': this.handleNewObject(data); break;
                case 'R': this.handleRemoveObject(data); break;
                case 'X': this.handleExplosion(data); break;
                case 'S': this.handleAttributePlayerKill(data); break;
                default:
                    break;
            }
        })
    }

    setClient(client: Client) {
        this.client = client
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

    private handleID(data: string[]) {
        console.log("Got ID: " + data[0])
        this.sessionID = parseInt(data[0])
    }

    private handleMove(data: string[]) {
        let objectID, x, y
        [ objectID, x, y ] = data

        let obj = this.tilesContainer.getTileByID(parseInt(objectID))
        if (obj) {
            obj.setPosition(parseInt(x), parseInt(y));
        }
    }
    private handleExplosion(data: string[]) {
        const [ x, y, height ]: string[] = data
        let boom = new Explosion(this.processing, this, new Color(255, 255, 255, 255), parseInt(height), 4)
        boom.setPosition(parseInt(x), parseInt(y));
        this.tilesContainer.addTile(boom)
    }

    private handleAttributePlayerKill(data: string[]) {
        const [ playerIDStr ]: string[] = data
        const playerId = parseInt(playerIDStr)
        if (this.player && this.player.id === playerId) {
            this.score++;
        }
    }

    private handleRemoveObject(data: string[]) {
        const [ objectID ]: string[] = data
        const tile = this.tilesContainer.getTileByID(parseInt(objectID))
        if (tile) {
            this.tilesContainer.removeTile(tile)
        }
    }
    private handleNewObject(data: string[]) {
        const [ objectID, objectType, x, y, height, speed ]: string[] = data
        let processing = this.processing
        switch(objectType) {
            case 'T': {
                console.log("MAKING TREE ", x, y, "id:", objectID)
                let tree = new Tree(processing, new Color(0, processing.random(100, 200), 0, 255), parseInt(height));
                tree.id = parseInt(objectID)
                this.tilesContainer.addTile(tree);
                tree.setPosition(parseInt(x), parseInt(y));

                break;
            }
            case 'Z': {
                console.log("MAKING ZOMBIE ", x, y, "id:", objectID)
                let zombieColor = new Color(0, 55, 0, 0)
                let speedInt = parseInt(speed)
                let zombieSize = parseInt(height)
                if (speedInt > 3) {
                    zombieColor = new Color(255, 0, 0, 0)
                }
                let robot = new Avatar( this.processing, zombieColor, zombieSize);
                robot.id = parseInt(objectID)
                robot.setPosition(parseInt(x), parseInt(y));
                robot.setRole("avatar");

                this.tilesContainer.addTile(robot);
                break;
            }
            case 'B': {
                console.log("MAKING BULLET ", x, y, "id:", objectID)
                let bullet = new Bullet(processing, new Color(255, 0, 0, 0), 8);
                bullet.id = parseInt(objectID)
                bullet.setPosition(parseInt(x), parseInt(y));
                bullet.setRole("bullet");
                this.tilesContainer.addTile(bullet);
                break;
            }
            case 'P': {
                console.log("MAKING PLAYER ", x, y, "id:", objectID)
                let objectIdInt = parseInt(objectID)
                let robot = new Avatar( this.processing, new Color(238, 255, 0, 255), 103);
                robot.id = objectIdInt
                robot.setPosition(parseInt(x), parseInt(y));
                robot.setRole("avatar");
                this.tilesContainer.addTile(robot);
                if (this.sessionID === objectIdInt) {
                    this.player = robot
                }
                break;
            }
            default:
        }
    }
}
