import Bounds from './bounds'

// sequence
let idSeq = 1

abstract class Tile {
    role: string
    x: number
    y: number
    id: number
    lastBounds: Bounds
    tileType: string

    protected lastX: number
    protected lastY: number
    protected noCollision: boolean

    constructor(tileType: string) {
        this.tileType = tileType
        this.lastBounds = new Bounds(0, 0, 0, 0)
        this.id = ++idSeq
    }

    setRole(role: string) {
        this.role = role
    }

    setPosition(x: number, y: number) {
        this.x = x
        this.y = y
    }

    abstract update(): void

    abstract calcBounds(x: number, y: number): Bounds

    getBounds(): Bounds {
        let x = this.x
        let y = this.y

        if (this.lastBounds && this.lastX === x && this.lastY === y) {
            return this.lastBounds
        }

        this.lastX = x
        this.lastY = y
        this.lastBounds = this.calcBounds(x, y)
        return this.lastBounds
    }

    abstract render(): void

    collideable(): boolean {
        return !this.noCollision
    }
}

export default Tile;