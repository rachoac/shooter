import Color from './color'
import Tile from './tile'
import Tree from './tree'
import Entity from './entity'
import Avatar from './avatar'
import TilesContainer from './tilescontainer'
import Bullet from "./bullet";
import Bomb from "./bomb";
import Explosion from "./explosion";
import ControlledExplosion from "./controlled_explosion";
import Message from "./message";

interface Client {
    send(value: string): void
}

export default class Engine {
    tilesContainer: TilesContainer
    player: Avatar
    private client: Client
    sessionID: number
    playerName: string
    connected: boolean
    killed: boolean
    hiScore: number
    hiScoreHolder: string
    mainFont: any
    largeFont: any

    constructor(tilesContainer: TilesContainer, playerName: string) {
        this.tilesContainer = tilesContainer;
        this.playerName = playerName

        this.mainFont = textFont("monospace", 15);
        this.largeFont = textFont("monospace", 30);

        this.mouseMovedHandling = this.mouseMovedHandling.bind(this)
        this.keyHandling = this.keyHandling.bind(this)
    }

    updatePosition(entity: Entity, newX: number, newY: number) {
        entity.setPosition(newX, newY)
    }

    restart() {
        this.tilesContainer.restart()
        this.killed = false
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

    static calcDistance(x1: number, y1: number, x2: number, y2: number) {
        let a = x1 - x2
        let b = y1 - y2

        return Math.sqrt(a * a + b * b)
    }
    keyHandling() {
        let keyCode = keyCode
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
            this.fireBullet(bulletSpeed, 0, -50, 0, -300);
        }
        if (keyCode === 83) {
            this.fireBullet(bulletSpeed, 0, -50, 0, 300);
        }
        if (keyCode === 65) {
            this.fireBullet(bulletSpeed, 0, -50, -300, -50);
        }
        if (keyCode === 68) {
            this.fireBullet(bulletSpeed, 0, -50, 300, -50);
        }

        if (keyCode === 32) {
            this.client.send(`B:${this.sessionID}`)
        }
    }

    mouseMovedHandling() {
        let mouseX = mouseX
        let mouseY = mouseY
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

        background(0, 0, 0);
        if (!this.player) {
            textFont(this.largeFont)
            fill(255, 0, 0);
            text("Waiting for connection...", width/2 - 140, height/2);
            return
        }

        if (!this.connected) {
            textFont(this.largeFont)
            fill(255, 0, 0);
            text("Lost connection", width/2 - 70, height/2);
            return
        }

        if (this.killed) {
            textFont(this.largeFont)
            fill(255, 0, 0);
            text("~YOU DIED, RIP!~", width/2 - 180, height/2);
            text(" Final score: " + this.player.score, width/2 - 180, height/2 + 40);
            text("Reload to try again",  width/2 - 180, height/2 + 80);
            return
        }

        if (Engine.calcDistance(this.player.x, this.player.y, mouseX, mouseY) > 220) {
            stroke(0, 173, 0, 200);
            strokeWeight(1);
            line(this.player.x, this.player.y - 20, mouseX, mouseY)
        }

        for ( let i = 0; i < tiles.length; i++ ) {
            let tile = tiles[i];
            tile.render();
        }

        // score
        fill(255, 0, 0);
        textFont(this.mainFont)
        text("Score " + this.player.score, 10, 30);
        let hpBars = ''
        for (let i = 0; i < this.player.hp; i++) hpBars += '|'
        fill(0,255,0);
        text("HP " + hpBars, 10, 50);

        let bulletBars = ''
        for (let i = 0; i < this.player.bullets; i++) bulletBars += '|'
        fill(255,255,255);
        text("MP " + bulletBars, 10, 70);

        if (this.hiScoreHolder) {
            fill(255, 255, 0);
            text(`High score: ${this.hiScore} - ${this.hiScoreHolder === this.playerName ? "YOU!" : this.hiScoreHolder}`, 10, 90);
        }

        fill(255, 0, 0);
        let bombBars = ''
        for (let i = 0; i < this.player.bombs; i++) bombBars += '!'
        text(bombBars, width - 100, 30);
    }

    onSocketClose(evt: any) {
        console.log("Close!", evt)
        this.connected = false
        this.restart()
    }

    onSocketOpen(evt: any) {
        if (evt){}
        this.restart()
        this.connected = true
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
                case 'A': this.handlePlayerAttributes(data); break;
                case 'x': this.handleExplosionAttributes(data); break;
                case 'K': this.handlePlayerKilled(data); break;
                case 'Y': this.handleHighScore(data); break;
                default:
                    break;
            }
        })
    }

    setClient(client: Client) {
        this.client = client
    }

    static initialize(playerName: string) {
        let w  = window,
            d  = w.document,
            de = d.documentElement,
            db = d.body || d.getElementsByTagName('body')[0],
            x  = w.innerWidth || de.clientWidth || db.clientWidth,
            y  = w.innerHeight|| de.clientHeight|| db.clientHeight;

        size(x,y);

        let tilesContainer = new TilesContainer();
        let engine = new Engine(tilesContainer, playerName);

        keyPressed = engine.keyHandling
        mouseMoved = engine.mouseMovedHandling

        engine.restart()
        return engine
    }

    private handleID(data: string[]) {
        console.log("Got ID: " + data[0])
        this.sessionID = parseInt(data[0])
        this.client.send(`I:${this.sessionID}:${this.playerName}`)
    }

    private handleMove(data: string[]) {
        const [ objectID, x, y ]: string[] = data

        let obj = this.tilesContainer.getTileByID(parseInt(objectID))
        if (obj) {
            obj.setPosition(parseInt(x), parseInt(y));
        }
    }
    private handleExplosion(data: string[]) {
        const [ x, y, height ]: string[] = data
        let boom = new Explosion(this, new Color(255, 255, 255, 255), parseInt(height), 4)
        boom.setPosition(parseInt(x), parseInt(y));
        this.tilesContainer.addTile(boom)
    }

    private handleExplosionAttributes(data: string[]) {
        const [ explosionID, height ]: string[] = data
        const tile = this.tilesContainer.getTileByID(parseInt(explosionID))
        if (tile) {
            var b: ControlledExplosion = <ControlledExplosion> tile
            b.height = parseInt(height)
        }
    }

    private handlePlayerAttributes(data: string[]) {
        const [ playerIDStr, scoreStr, hpStr, bulletsStr, bombsStr ]: string[] = data
        const playerId = parseInt(playerIDStr)
        const tile = this.tilesContainer.getTileByID(playerId)
        if (tile) {
            var b: Avatar = <Avatar> tile
            b.setScore(parseInt(scoreStr))
            b.setHp(parseInt(hpStr))
            b.setBullets(parseInt(bulletsStr))
            b.setBombs(parseInt(bombsStr))
        }
    }

    private handlePlayerKilled(data: string[]) {
        const [ playerIDStr ]: string[] = data
        const playerId = parseInt(playerIDStr)
        if (this.player && this.player.id === playerId) {
            // handle killed
            this.killed = true
        }
        const killedPlayer = this.tilesContainer.getTileByID(playerId)
        if (killedPlayer) {
            let playerAvatar: Avatar = <Avatar> killedPlayer
            let rip = new Message(this, "RIP " + playerAvatar.getName(), 300)
            rip.setPosition(playerAvatar.x, playerAvatar.y);
            this.tilesContainer.addTile(rip)
        }
    }

    private handleHighScore(data: string[]) {
        const [ scoreStr, holderName ]: string[] = data
        this.hiScoreHolder = holderName
        this.hiScore = parseInt(scoreStr)
    }

    private handleRemoveObject(data: string[]) {
        const [ objectID ]: string[] = data
        const tile = this.tilesContainer.getTileByID(parseInt(objectID))
        if (tile) {
            this.tilesContainer.removeTile(tile)
        }
    }
    private handleNewObject(data: string[]) {
        const [ objectID, objectType, x, y, height, speed, name, score, origin ]: string[] = data
        switch(objectType) {
            case 'T': {
                console.log("MAKING TREE ", x, y, "id:", objectID)
                let tree = new Tree(new Color(0, random(100, 200), 0, 255), parseInt(height));
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
                let robot = new Avatar( zombieColor, zombieSize);
                robot.id = parseInt(objectID)
                robot.setPosition(parseInt(x), parseInt(y));
                robot.setRole("avatar");

                this.tilesContainer.addTile(robot);
                break;
            }
            case 'B': {
                console.log("MAKING BULLET ", x, y, "id:", objectID)
                let bullet = new Bullet(new Color(255, 0, 0, 0), 8);
                bullet.id = parseInt(objectID)
                bullet.setPosition(parseInt(x), parseInt(y));
                bullet.setRole("bullet");
                this.tilesContainer.addTile(bullet);
                break;
            }
            case 'X': {
                console.log("MAKING BOMB ", x, y, "id:", objectID)
                let originId = parseInt(origin)
                let bomb = new Bomb( originId == this.sessionID ? new Color(255, 255, 255, 0) : new Color(255, 0, 0, 0), 8);
                bomb.id = parseInt(objectID)
                bomb.setPosition(parseInt(x), parseInt(y));
                bomb.setRole("bomb");
                this.tilesContainer.addTile(bomb);
                break;
            }
            case 'C': {
                console.log("MAKING CONTROLLED EXPLOSION ", x, y, "id:", objectID)
                let explosion = new ControlledExplosion(this, parseInt(height));
                explosion.id = parseInt(objectID)
                explosion.setPosition(parseInt(x), parseInt(y));
                explosion.setRole("controlled_explosion");
                this.tilesContainer.addTile(explosion);
                break;
            }
            case 'P': {
                console.log("MAKING PLAYER ", x, y, "id:", objectID)
                let objectIdInt = parseInt(objectID)
                let robot = new Avatar( new Color(238, 255, 0, 255), 103);
                robot.id = objectIdInt
                robot.setPosition(parseInt(x), parseInt(y));
                robot.setRole("avatar");
                robot.setName(name)
                robot.setScore(parseInt(score))
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