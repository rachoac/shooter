import Color from "./color";
import Tile from "./tile";

export default class Bomb extends Tile {

    private color: Color
    private height: number

    constructor(color: Color, height: number) {
        super("bomb")
        this.color = color
        this.height = height
        this.noCollision = true
    }

    update() {
        return true
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
        fill(this.color.r, this.color.g, this.color.b)
        stroke(0, 255, 255)
        ellipse(x, y, height, height)
    }

}
