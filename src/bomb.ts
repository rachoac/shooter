import Entity from "./entity";
import Color from "./color";
import Engine from "./engine";
import Tile from "./tile";
import Explosion from "./explosion";

export default class Bomb extends Entity {
    constructor(processing: any, engine: Engine, color: Color, height: number, speed: number) {
        super(processing, engine, color, height, speed, "bomb")
    }

    onTargetMet() {
    }

    onCollision(collidedTile: Tile) {
        let boom = new Explosion(this.processing, this.engine, new Color(255, 255, 255, 255), 180, 8)
        boom.setPosition(this.x, this.y)
        this.tilesContainer.addTile(boom)
        this.tilesContainer.removeTile(this)
        this.engine.damage(collidedTile)
    }

    calcBounds(x: number, y: number) {
        let boundWidth = this.height
        let boundX = x - boundWidth / 2
        let boundY = y - boundWidth / 2
        let boundX2 = boundX + boundWidth
        let boundY2 = boundY + boundWidth
        this.lastBounds.x1 = boundX
        this.lastBounds.y1 = boundY
        this.lastBounds.x2 = boundX2
        this.lastBounds.y2 = boundY2
        this.lastBounds.recompute()

        return this.lastBounds
    }

    render() {
        let height = this.height
        let x = this.x
        let y = this.y
        this.processing.stroke(this.color.r, this.color.g, this.color.b)
        this.processing.fill(0, 255, 255)
        this.processing.ellipse(x, y, height, height)
    }

}
