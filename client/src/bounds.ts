export default class Bounds {
    x1: number
    y1: number
    x2: number
    y2: number
    width: number
    height: number

    constructor(x1: number, y1: number, x2: number, y2: number) {
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.width = this.x2 - this.x1
        this.height = this.y2 - this.y1
    }

    collision(other: Bounds): boolean {
        return !(other.x1 > this.x2 || other.x2 < this.x1 || other.y1 > this.y2 || other.y2 < this.y1)
    }

    recompute() {
        this.width = this.x2 - this.x1
        this.height = this.y2 - this.y1
    }
}
