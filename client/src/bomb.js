"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var entity_1 = require("./entity");
var color_1 = require("./color");
var explosion_1 = require("./explosion");
var Bomb = (function (_super) {
    __extends(Bomb, _super);
    function Bomb(processing, engine, color, height, speed) {
        _super.call(this, processing, engine, color, height, speed, "bomb");
    }
    Bomb.prototype.onTargetMet = function () {
    };
    Bomb.prototype.onCollision = function (collidedTile) {
        var boom = new explosion_1["default"](this.processing, this.engine, new color_1["default"](255, 255, 255, 255), 180, 8);
        boom.setPosition(this.x, this.y);
        this.tilesContainer.addTile(boom);
        this.tilesContainer.removeTile(this);
        this.engine.damage(collidedTile);
    };
    Bomb.prototype.calcBounds = function (x, y) {
        var boundWidth = this.height;
        var boundX = x - boundWidth / 2;
        var boundY = y - boundWidth / 2;
        var boundX2 = boundX + boundWidth;
        var boundY2 = boundY + boundWidth;
        this.lastBounds.x1 = boundX;
        this.lastBounds.y1 = boundY;
        this.lastBounds.x2 = boundX2;
        this.lastBounds.y2 = boundY2;
        this.lastBounds.recompute();
        return this.lastBounds;
    };
    Bomb.prototype.render = function () {
        var height = this.height;
        var x = this.x;
        var y = this.y;
        this.processing.stroke(this.color.r, this.color.g, this.color.b);
        this.processing.fill(0, 255, 255);
        this.processing.ellipse(x, y, height, height);
    };
    return Bomb;
}(entity_1["default"]));
exports.__esModule = true;
exports["default"] = Bomb;
//# sourceMappingURL=bomb.js.map