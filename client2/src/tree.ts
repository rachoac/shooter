import Color from "./color";
import Tile from "./tile";
import Bounds from "./bounds";

export default class Tree extends Tile {

    private color: Color
    private height: number

    constructor(color: Color, height: number) {
        super("tree")
        this.color = color
        this.height = height
    }

    update() {}

    render() {
        let x = this.x
        let y = this.y
        let height = this.height
        let color = this.color
        stroke(0, 0, 0)
        fill(102, 0, 39)
        rect(x, y - height, height/8, height)
        fill(color.r, color.g, color.b)
        ellipse(x + height/16, y - height, height/2, height/2)
    }

    calcBounds(x: number, y: number): Bounds {
        let height = this.height
        let boundWidth = height * 0.25
        let boundX = x - boundWidth * 0.05
        let boundY = y - height * 0.12
        let boundX2 = boundX + height * 0.15
        let boundY2 = boundY + height * 0.12
        this.lastBounds.x1 = boundX
        this.lastBounds.y1 = boundY
        this.lastBounds.x2 = boundX2
        this.lastBounds.y2 = boundY2
        this.lastBounds.recompute()

        return this.lastBounds
    }
}
