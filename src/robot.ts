import Entity from "./entity";
import Color from "./color";
import Engine from "./engine";
import Bounds from "./bounds";
import Bullet from "./bullet";

export default class Robot extends Entity {
    constructor(processing: any, engine: Engine, color: Color, height: number, speed: number) {
        super(processing, engine, color, height, speed, "robot")
    }

    onTargetMet() {}

    calcBounds(x: number, y: number) {
        let height = this.height
        let boundWidth = height * 0.25
        let boundX = x - boundWidth * 0.27
        let boundY = y - height * 0.12
        let boundX2 = boundX + height *0.14
        let boundY2 = boundY + height * 0.12
        this.lastBounds.x1 = boundX
        this.lastBounds.y1 = boundY
        this.lastBounds.x2 = boundX2
        this.lastBounds.y2 = boundY2
        this.lastBounds.recompute()

        return this.lastBounds
    }

    render() {
        let height = this.height
        let color = this.color
        let x = this.x
        let y = this.y - height/2

        this.processing.stroke(255, 255, 255)
        // head
        this.processing.fill(color.r, color.g, color.b)
        this.processing.ellipse(x, y, height/4, height/4)
        // body
        this.processing.line(x, y + height/8, x, y + height/3)
        this.processing.line(x - height/6, y + height/8, x + height/6, y + height/8)
        this.processing.line(x, y + height/3, x - height/6, y + height/2)
        this.processing.line(x, y + height/3, x + height/6, y + height/2)
    }

    getAttackableBounds(): Bounds {
        let height = this.height
        let x = this.x - height * 0.13
        let y = this.y - height * 0.63
        return new Bounds(x, y, x + height/4, y + height/4)
    }

    fireBullet(speed: number, xOffsetStart: number, yOffsetStart: number, xOffsetEnd: number, yOffsetEnd: number) {
        let x = this.x
        let y = this.y
        let bullet = new Bullet(this.processing, this.engine, new Color(255, 0, 0, 0), 8, speed, this.id)
        bullet.setPosition(x + xOffsetStart, y + yOffsetStart)
        bullet.setTarget(x + xOffsetEnd, y + yOffsetEnd)
        this.tilesContainer.addTile(bullet)
    }

    collisionDetector(x: number, y: number, otherTile: Entity) {
        let collided = Entity.prototype.collisionDetector.call(this, x, y, otherTile)
        if (collided && this.role === "player" && this.id !== otherTile.id && otherTile.role === "zombie") {
            // game over
            this.engine.restart()
        }
        return collided
    }
}
