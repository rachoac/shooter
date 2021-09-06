import Color from "./color";
import Engine from "./engine";
import Tile from "./tile";

export default class Explosion extends Tile {
    private color: Color
    private height: number
    private speed: number
    private engine: Engine
    private distance: number
    private currentSize: number
    private increment: number
    private turns: number

    constructor(engine: Engine, color: Color, height: number, speed: number) {
        super("explosion")
        this.color = color
        this.height = height
        this.speed = speed
        this.engine = engine
        this.distance = 0
        this.currentSize = 0
        this.increment = 1
        this.turns = 0
        this.noCollision = true
    }

    render() {
        let x = this.x
        let y = this.y

        if (this.currentSize > 30) {
            stroke(200, 0, 0)
            fill(200, 0, 0)
            ellipse(x, y, this.currentSize, this.currentSize)
            stroke(255, 0, 0)
            fill(255, 0, 0)
            ellipse(x, y, this.currentSize, this.currentSize * 0.90)
        } else {
            stroke(255, 255, 255)
            fill(random(0,255), random(0,255), random(0, 255))
            ellipse(x, y, this.currentSize, this.currentSize)
        }

    }

    update() {
        let tilesContainer = this.engine.tilesContainer
        if (this.turns > 1) {
            tilesContainer.removeTile(this)
            return true
        }
        if (this.increment === 1) {
            this.currentSize += this.speed
            if (this.currentSize > this.height) {
                this.turns += 1
                this.increment = -1
            }
        } else {
            this.currentSize -= this.speed
            if (this.currentSize < 1) {
                this.turns += 1
                this.increment = 1
            }
        }
        return true
    }

    calcBounds(x: number, y: number) {
        console.log(x, y)
        return this.lastBounds
    }
}
