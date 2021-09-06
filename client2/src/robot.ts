import Entity from "./entity";
import Color from "./color";
import Engine from "./engine";
import Bounds from "./bounds";

export default class Robot extends Entity {
    constructor(engine: Engine, color: Color, height: number, speed: number) {
        super(engine, color, height, speed, "robot")
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

        stroke(255, 255, 255)
        // head
        fill(color.r, color.g, color.b)
        ellipse(x, y, height/4, height/4)
        // body
        line(x, y + height/8, x, y + height/3)
        line(x - height/6, y + height/8, x + height/6, y + height/8)
        line(x, y + height/3, x - height/6, y + height/2)
        line(x, y + height/3, x + height/6, y + height/2)
    }

    getAttackableBounds(): Bounds {
        let height = this.height
        let x = this.x - height * 0.13
        let y = this.y - height * 0.63
        return new Bounds(x, y, x + height/4, y + height/4)
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
