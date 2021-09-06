import Color from "./color";
import Tile from "./tile";
import Bounds from "./bounds";

export default class Bullet extends Tile {

    private color: Color
    private height: number

    constructor(color: Color, height: number) {
        super("bullet")
        this.color = color
        this.height = height
    }

    update() {
        return true
    }

    render() {
        let height = this.height
        let color = this.color
        let x = this.x
        let y = this.y
        stroke(255, 255, 255)
        fill(color.r, color.g, color.b)
        ellipse(x, y, height/2, height)
        ellipse(x, y, height, height/2)
    }

    calcBounds(x: number, y: number): Bounds {
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
}
