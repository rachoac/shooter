"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tile_1 = require("./tile");
var Bullet = (function (_super) {
    __extends(Bullet, _super);
    function Bullet(processing, color, height) {
        _super.call(this, processing, "bullet");
        this.color = color;
        this.height = height;
    }
    Bullet.prototype.update = function () {
        return true;
    };
    Bullet.prototype.render = function () {
        var height = this.height;
        var color = this.color;
        var x = this.x;
        var y = this.y;
        this.processing.stroke(255, 255, 255);
        this.processing.fill(color.r, color.g, color.b);
        this.processing.ellipse(x, y, height / 2, height);
        this.processing.ellipse(x, y, height, height / 2);
    };
    Bullet.prototype.calcBounds = function (x, y) {
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
    return Bullet;
}(tile_1["default"]));
exports.__esModule = true;
exports["default"] = Bullet;
//# sourceMappingURL=bullet.js.map