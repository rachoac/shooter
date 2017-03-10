import Engine from "./engine";
import Tile from "./tile";

export default class Message extends Tile {
    private engine: Engine
    private message: string
    private turns: number
    private currentTurns: number
    private f: any

    constructor(processing: any, engine: Engine, message: string, turns: number) {
        super(processing, "rip")
        this.engine = engine
        this.turns = turns
        this.currentTurns = 0
        this.message = message
        this.noCollision = true
        this.f = processing.createFont("monospace", 15);
    }

    render() {
        let x = this.x
        let y = this.y
        this.processing.textFont(this.f)
        this.processing.fill(this.processing.random(0,255), this.processing.random(0,255), this.processing.random(0, 255))
        this.processing.text(this.message, x - 50, y);
    }

    update() {
        let tilesContainer = this.engine.tilesContainer
        if (this.currentTurns > this.turns) {
            tilesContainer.removeTile(this)
            return true
        }

        this.currentTurns++
        return true
    }

    calcBounds(x: number, y: number) {
        if (x && y) {}
        return this.lastBounds
    }
}
