import Entity from "./entity";
import Color from "./color";
import Engine from "./engine";
import Tile from "./tile";
import Explosion from "./explosion";

export default class Bullet extends Entity {
    private originId: number
    private distance: number
    private range: number
    constructor(processing: any, engine: Engine, color: Color, height: number, speed: number, originId: number) {
        super(processing, engine, color, height, speed, "bullet")
        this.originId = originId
        this.distance = 0
        this.range = 400
    }

    calcBounds(x: number, y: number) {
        let boundWidth = this.height
        let boundX = x - boundWidth/2
        let boundY = y - boundWidth/2
        let boundX2 = boundX + boundWidth
        let boundY2 = boundY + boundWidth
        this.lastBounds.x1 = boundX
        this.lastBounds.y1 = boundY
        this.lastBounds.x2 = boundX2
        this.lastBounds.y2 = boundY2
        this.lastBounds.recompute()

        return this.lastBounds
    }

    onTargetMet() {
        this.tilesContainer.removeTile(this)
    }

    onCollision(collidedTile: Tile) {
        console.log(collidedTile)
        let boom = new Explosion(this.processing, this.engine, new Color(255, 255, 255, 255), 40, 8)
        boom.setPosition(this.x, this.y)
        this.tilesContainer.addTile(boom)
        this.tilesContainer.removeTile(this)
    }

    collisionDetector(x: number, y: number, otherTile: Entity) {
        let collided = Entity.prototype.collisionDetector.call(this, x, y, otherTile)

        if (otherTile.id !== this.originId &&
            otherTile.getAttackableBounds &&
            otherTile.getAttackableBounds().collision(this.getBounds())
        ) {
            this.engine.killedZombie(otherTile)

            return true
        }
        return collided
    }

    update() {
        this.distance += this.speed
        if (this.distance > this.range) {
            this.tilesContainer.removeTile(this)
            return true
        }
        return super.update()
    }

    render() {
        let height = this.height
        let color = this.color
        let x = this.x
        let y = this.y
        this.processing.stroke(255, 255, 255)
        this.processing.fill(color.r, color.g, color.b)
        this.processing.ellipse(x, y, height/2, height)
        this.processing.ellipse(x, y, height, height/2)
    }
}
