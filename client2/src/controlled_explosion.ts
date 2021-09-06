import Engine from "./engine";
import Tile from "./tile";

export default class Explosion extends Tile {
    height: number
    private engine: Engine

    constructor(engine: Engine, height: number) {
        super("controlled_explosion")
        this.height = height
        this.engine = engine
        this.noCollision = true
    }

    render() {
        let x = this.x
        let y = this.y
        stroke(255, 0, 0)
        fill(255, 0, 0)
        ellipse(x, y, this.height, this.height)
    }

    update() {
        return true
    }

    calcBounds(x: number, y: number) {
        console.log(x, y)
        return this.lastBounds
    }
}
