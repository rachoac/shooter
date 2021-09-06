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

    constructor(engine: Engine, color: Color, height: number, speed: number, tileType: string) {
        super(tileType)
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

        let increment = this.speed

        let newX = x
        let newY = y

        if (x < targetX) {
            newX += Math.min(increment, Math.abs(targetX - x))
        }
        if (x > targetX) {
            newX -= Math.min(increment, Math.abs(targetX - x))
        }
        if (y < targetY) {
            newY += Math.min(increment, Math.abs(targetY - y))
        }
        if (y > targetY) {
            newY -= Math.min(increment, Math.abs(targetY - y))
        }

        let distance2 = Entity.calcDistance(newX, newY, targetX, targetY)

        if (distance2 < increment) {
            newX = targetX
            newY = targetY
        }

        let collidedTile = this.engine.tilesContainer.collisionAt(this, newX, newY).tile
        if (collidedTile) {
            this.onCollision(collidedTile)
            return
        }
        this.engine.updatePosition(this, newX, newY)

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