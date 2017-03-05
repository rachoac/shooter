import Color from "./color";
import Tile from "./tile";
import Bounds from "./bounds";

export default class Avatar extends Tile {

    private color: Color
    private height: number
    private name: string
    private f: any
    private f2: any
    score: number
    hp: number
    bullets: number

    constructor(processing: any, color: Color, height: number) {
        super(processing, "avatar")
        this.color = color
        this.height = height
        this.f = processing.createFont("monospace", 15);
        this.f2 = processing.createFont("monospace", 8);
    }

    setScore(score: number) {
        this.score = score
    }

    getName(): string {
        return this.name
    }

    setHp(hp: number) {
        this.hp = hp
    }

    setBullets(bullets: number) {
        this.bullets = bullets
    }

    setName(name: string) {
        this.name = name
    }

    strToHex(str: string): string {
        function hashCode(str: string) { // java String#hashCode
            var hash = 0;
            for (var i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        }

        function intToRGB(i: number){
            var c = (i & 0x00FFFFFF)
                .toString(16)
                .toUpperCase();

            return "00000".substring(0, 6 - c.length) + c;
        }

        return intToRGB(hashCode(str))
    }

    hexToRgb(hex: string): any {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    render() {
        let height = this.height
        let color = this.color
        let x = this.x
        let y = this.y - height/2

        this.processing.stroke(255, 255, 255)
        // head

        if (this.name) {
            let rgb = this.hexToRgb(this.strToHex(this.name))
            this.processing.fill(rgb.r, rgb.g, rgb.b)
        } else {
            this.processing.fill(color.r, color.g, color.b)
        }
        this.processing.ellipse(x, y, height/4, height/4)
        // body
        this.processing.line(x, y + height/8, x, y + height/3)
        this.processing.line(x - height/6, y + height/8, x + height/6, y + height/8)
        this.processing.line(x, y + height/3, x - height/6, y + height/2)
        this.processing.line(x, y + height/3, x + height/6, y + height/2)

        this.processing.textFont(this.f)
        this.processing.fill(255, 255, 255)
        if (this.name) {
            let hpBars = ''
            for (let i = 0; i < this.hp; i++) hpBars += '|'
            this.processing.fill(0,255,0);
            this.processing.text(this.name + " " + this.score, x - height/4, y - height/4 - 15);
            this.processing.textFont(this.f2)
            if (this.hp < 4) {
                this.processing.fill(255, 255, 255)
            } else {
                this.processing.fill(0, 255, 0)
            }
            this.processing.text(hpBars, x - height/4, y - height/4);
        }
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

    update() {
        return true
    }
}
