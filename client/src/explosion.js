"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tile_1 = require("./tile");
var Explosion = (function (_super) {
    __extends(Explosion, _super);
    function Explosion(processing, engine, color, height, speed) {
        _super.call(this, processing, "explosion");
        this.color = color;
        this.height = height;
        this.speed = speed;
        this.engine = engine;
        this.distance = 0;
        this.currentSize = 0;
        this.increment = 1;
        this.turns = 0;
        this.noCollision = true;
    }
    Explosion.prototype.render = function () {
        var x = this.x;
        var y = this.y;
        this.processing.stroke(255, 255, 255);
        this.processing.fill(this.processing.random(0, 255), this.processing.random(0, 255), this.processing.random(0, 255));
        this.processing.ellipse(x, y, this.currentSize, this.currentSize);
    };
    Explosion.prototype.update = function () {
        var tilesContainer = this.engine.tilesContainer;
        if (this.turns > 1) {
            tilesContainer.removeTile(this);
            return true;
        }
        if (this.increment === 1) {
            this.currentSize += this.speed;
            if (this.currentSize > this.height) {
                this.turns += 1;
                this.increment = -1;
            }
        }
        else {
            this.currentSize -= this.speed;
            if (this.currentSize < 1) {
                this.turns += 1;
                this.increment = 1;
            }
        }
        return true;
    };
    Explosion.prototype.calcBounds = function (x, y) {
        console.log(x, y);
        return this.lastBounds;
    };
    return Explosion;
}(tile_1["default"]));
exports.__esModule = true;
exports["default"] = Explosion;
//# sourceMappingURL=explosion.js.map