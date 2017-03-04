import Color from "./color";
import Engine from "./engine";
import Tile from "./tile";
import TilesContainer from "./tilescontainer";
import Bounds from "./bounds";

abstract class Entity extends Tile {
    protected engine: Engine
    protected color: Color
    protected height: number
    speed: number
    protected targetEntity: Entity
    protected targetX: number
    protected targetY: number
    protected tilesContainer: TilesContainer

    constructor(processing: any, engine: Engine, color: Color, height: number, speed: number, tileType: string) {
        super(processing, tileType)
        this.engine = engine
        this.color = color
        this.height = height
        this.speed = speed
        this.tilesContainer = engine.tilesContainer
    }

    static calcDistance(x1: number, y1: number, x2: number, y2: number) {
        let a = x1 - x2
        let b = y1 - y2

        return Math.sqrt(a * a + b * b)
    }

    setTarget(x: number, y: number) {
        this.targetX = x
        this.targetY = y
    }

    setTargetEntity(entity: Entity) {
        this.targetEntity = entity;
    };

    update() {
        let x = this.x
        let y = this.y
        let targetX = this.targetX
        let targetY = this.targetY


        if (this.targetEntity) {
            targetX = this.targetEntity.x
            targetY = this.targetEntity.y
        }

        if (x === targetX && y === targetY) {
            this.onTargetMet()
            return
        }

        let distance1 = Entity.calcDistance(x, y, targetX, targetY)
        let increment = this.speed

        let newX = x
        let newY = y

        if (x < targetX) {
            newX += increment
        }
        if (x > targetX) {
            newX -= increment
        }
        if (y < targetY) {
            newY += increment
        }
        if (y > targetY) {
            newY -= increment
        }

        let distance2 = Entity.calcDistance(newX, newY, targetX, targetY)

        if (distance2 > distance1) {
            newX = targetX
            newY = targetY
        }

        let collidedTile = this.engine.tilesContainer.collisionAt(this, newX, newY).tile
        if (collidedTile) {
            this.onCollision(collidedTile)
            return
        }
        this.setPosition(newX, newY)

        return true
    }

    getAttackableBounds(): Bounds {
        return new Bounds(0, 0, 0, 0)
    }

    collisionDetector(x: number, y: number, otherTile: Tile) {
        let targetBounds
        if (this.lastX === x && this.lastY === y) {
            targetBounds = this.getBounds()
        } else {
            targetBounds = this.calcBounds(x, y)
        }
        if (otherTile.id === this.id) {
            return false
        }
        let tileBounds = otherTile.getBounds()
        return !!targetBounds.collision(tileBounds)
    }

    abstract onTargetMet(): void

    onCollision(collidedTile: Tile) {
        if(collidedTile){}
    }
}

export default Entity;