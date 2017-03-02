import Tile from './tile'
import Entity from "./entity";

class Map<T> {
    private items: { [key: string]: T };

    constructor() {
        this.items = {};
    }

    add(key: string, value: T): void {
        this.items[key] = value;
    }

    has(key: string): boolean {
        return key in this.items;
    }

    get(key: string): T {
        return this.items[key];
    }
}

export default  class TilesContainer {
    tiles: Tile[]
    tilesByRole: Map<Tile[]>

    constructor() {
        this.restart()
    }
    addTile(tile: Tile) {
        this.tiles.push(tile);
        if (tile.role) {
            let tiles = this.tilesByRole.get(tile.role);
            if (!tiles) {
                tiles = [];
                this.tilesByRole.add(tile.role, tiles);
            }
            tiles.push(tile);
        }
    }

    sortTiles() {
        let swapped;
        let tiles = this.tiles;
        do {
            swapped = false;
            for (let i=0; i < tiles.length-1; i++) {
                if (tiles[i].y > tiles[i+1].y) {
                    let temp = tiles[i];
                    tiles[i] = tiles[i+1];
                    tiles[i+1] = temp;
                    swapped = true;
                }
            }
        } while (swapped);
    }

    getTiles(): Tile[] {
        return this.tiles
    }

    collisionAt(targetTile: Entity, x: number, y: number): { tile?: Tile } {
        let tiles = this.tiles;
        for (let i = 0; i < tiles.length; i++) {
            let tile = tiles[i];
            if (!tile.collideable()) {
                continue;
            }
            if (targetTile.collisionDetector(x, y, tile)) {
                return { tile };
            }
        }

        return { tile: undefined };
    }

    removeTile(tile: Tile) {
        this.tiles = this.tiles.filter( function(t) {
            return t.id !== tile.id;
        });
        let typeTiles = this.tilesByRole.get(tile.role);
        if (!typeTiles) {
            return;
        }
        typeTiles = typeTiles.filter( function(t) {
            return t.id !== tile.id;
        });
        this.tilesByRole.add(tile.role, typeTiles);
    }

    getTilesByRole(entityRole: string): Tile[] {
        return this.tilesByRole.get(entityRole);
    }

    restart() {
        this.tiles = []
        this.tilesByRole = new Map<Tile[]>()
    }
}

