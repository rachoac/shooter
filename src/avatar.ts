import Color from "./color";
import Tile from "./tile";
import Bounds from "./bounds";

export default class Avatar extends Tile {

    private color: Color
    private height: number

    constructor(processing: any, color: Color, height: number) {
        super(processing, "avatar")
        this.color = color
        this.height = height
    }

    update() {}

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

    calcBounds(x: number, y: number): Bounds {
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
}
