"use strict";
var bounds_1 = require('./bounds');
// sequence
var idSeq = 1;
var Tile = (function () {
    function Tile(processing, tileType) {
        this.processing = processing;
        this.tileType = tileType;
        this.lastBounds = new bounds_1["default"](0, 0, 0, 0);
        this.id = ++idSeq;
    }
    Tile.prototype.setRole = function (role) {
        this.role = role;
    };
    Tile.prototype.setPosition = function (x, y) {
        this.x = x;
        this.y = y;
    };
    Tile.prototype.getBounds = function () {
        var x = this.x;
        var y = this.y;
        if (this.lastBounds && this.lastX === x && this.lastY === y) {
            return this.lastBounds;
        }
        this.lastX = x;
        this.lastY = y;
        this.lastBounds = this.calcBounds(x, y);
        return this.lastBounds;
    };
    Tile.prototype.collideable = function () {
        return !this.noCollision;
    };
    return Tile;
}());
exports.__esModule = true;
exports["default"] = Tile;
//# sourceMappingURL=tile.js.map