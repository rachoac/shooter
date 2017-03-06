"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var entity_1 = require("./entity");
var bounds_1 = require("./bounds");
var Robot = (function (_super) {
    __extends(Robot, _super);
    function Robot(processing, engine, color, height, speed) {
        _super.call(this, processing, engine, color, height, speed, "robot");
    }
    Robot.prototype.onTargetMet = function () { };
    Robot.prototype.calcBounds = function (x, y) {
        var height = this.height;
        var boundWidth = height * 0.25;
        var boundX = x - boundWidth * 0.27;
        var boundY = y - height * 0.12;
        var boundX2 = boundX + height * 0.14;
        var boundY2 = boundY + height * 0.12;
        this.lastBounds.x1 = boundX;
        this.lastBounds.y1 = boundY;
        this.lastBounds.x2 = boundX2;
        this.lastBounds.y2 = boundY2;
        this.lastBounds.recompute();
        return this.lastBounds;
    };
    Robot.prototype.render = function () {
        var height = this.height;
        var color = this.color;
        var x = this.x;
        var y = this.y - height / 2;
        this.processing.stroke(255, 255, 255);
        // head
        this.processing.fill(color.r, color.g, color.b);
        this.processing.ellipse(x, y, height / 4, height / 4);
        // body
        this.processing.line(x, y + height / 8, x, y + height / 3);
        this.processing.line(x - height / 6, y + height / 8, x + height / 6, y + height / 8);
        this.processing.line(x, y + height / 3, x - height / 6, y + height / 2);
        this.processing.line(x, y + height / 3, x + height / 6, y + height / 2);
    };
    Robot.prototype.getAttackableBounds = function () {
        var height = this.height;
        var x = this.x - height * 0.13;
        var y = this.y - height * 0.63;
        return new bounds_1["default"](x, y, x + height / 4, y + height / 4);
    };
    // fireBullet(speed: number, xOffsetStart: number, yOffsetStart: number, xOffsetEnd: number, yOffsetEnd: number) {
    //     let x = this.x
    //     let y = this.y
    //     let bullet = new Bullet(this.processing, this.engine, new Color(255, 0, 0, 0), 8, speed, this.id)
    //     bullet.setPosition(x + xOffsetStart, y + yOffsetStart)
    //     bullet.setTarget(x + xOffsetEnd, y + yOffsetEnd)
    //     this.tilesContainer.addTile(bullet)
    // }
    Robot.prototype.collisionDetector = function (x, y, otherTile) {
        var collided = entity_1["default"].prototype.collisionDetector.call(this, x, y, otherTile);
        if (collided && this.role === "player" && this.id !== otherTile.id && otherTile.role === "zombie") {
            // game over
            this.engine.restart();
        }
        return collided;
    };
    return Robot;
}(entity_1["default"]));
exports.__esModule = true;
exports["default"] = Robot;
//# sourceMappingURL=robot.js.map