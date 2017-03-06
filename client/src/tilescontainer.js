"use strict";
var Map = (function () {
    function Map() {
        this.items = {};
    }
    Map.prototype.add = function (key, value) {
        this.items[key] = value;
    };
    Map.prototype.has = function (key) {
        return key in this.items;
    };
    Map.prototype.remove = function (key) {
        delete this.items[key];
    };
    Map.prototype.get = function (key) {
        return this.items[key];
    };
    return Map;
}());
var TilesContainer = (function () {
    function TilesContainer() {
        this.restart();
    }
    TilesContainer.prototype.addTile = function (tile) {
        this.tiles.push(tile);
        this.tilesByID.add(String(tile.id), tile);
        if (tile.role) {
            var tiles = this.tilesByRole.get(tile.role);
            if (!tiles) {
                tiles = [];
                this.tilesByRole.add(tile.role, tiles);
            }
            tiles.push(tile);
        }
    };
    TilesContainer.prototype.sortTiles = function () {
        var swapped;
        var tiles = this.tiles;
        do {
            swapped = false;
            for (var i = 0; i < tiles.length - 1; i++) {
                if (tiles[i].y > tiles[i + 1].y) {
                    var temp = tiles[i];
                    tiles[i] = tiles[i + 1];
                    tiles[i + 1] = temp;
                    swapped = true;
                }
            }
        } while (swapped);
    };
    TilesContainer.prototype.getTiles = function () {
        return this.tiles;
    };
    TilesContainer.prototype.getTileByID = function (id) {
        return this.tilesByID.get(String(id));
    };
    TilesContainer.prototype.collisionAt = function (targetTile, x, y) {
        var tiles = this.tiles;
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            if (!tile.collideable()) {
            }
            if (targetTile.collisionDetector(x, y, tile)) {
            }
        }
        return { tile: undefined };
    };
    TilesContainer.prototype.removeTile = function (tile) {
        this.tiles = this.tiles.filter(function (t) {
            return t.id !== tile.id;
        });
        var typeTiles = this.tilesByRole.get(tile.role);
        if (!typeTiles) {
            return;
        }
        typeTiles = typeTiles.filter(function (t) {
            return t.id !== tile.id;
        });
        this.tilesByRole.add(tile.role, typeTiles);
        this.tilesByID.remove(String(tile.id));
    };
    TilesContainer.prototype.getTilesByRole = function (entityRole) {
        return this.tilesByRole.get(entityRole);
    };
    TilesContainer.prototype.restart = function () {
        this.tiles = [];
        this.tilesByID = new Map();
        this.tilesByRole = new Map();
    };
    return TilesContainer;
}());
exports.__esModule = true;
exports["default"] = TilesContainer;
//# sourceMappingURL=tilescontainer.js.map