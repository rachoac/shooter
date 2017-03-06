"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tile_1 = require("./tile");
var bounds_1 = require("./bounds");
var Entity = (function (_super) {
    __extends(Entity, _super);
    function Entity(processing, engine, color, height, speed, tileType) {
        _super.call(this, processing, tileType);
        this.engine = engine;
        this.color = color;
        this.height = height;
        this.speed = speed;
        this.tilesContainer = engine.tilesContainer;
    }
    Entity.calcDistance = function (x1, y1, x2, y2) {
        var a = x1 - x2;
        var b = y1 - y2;
        return Math.sqrt(a * a + b * b);
    };
    Entity.prototype.setTarget = function (x, y) {
        this.targetX = x;
        this.targetY = y;
    };
    Entity.prototype.setTargetEntity = function (entity) {
        this.targetEntity = entity;
    };
    ;
    Entity.prototype.update = function () {
        var x = this.x;
        var y = this.y;
        var targetX = this.targetX;
        var targetY = this.targetY;
        if (this.targetEntity) {
            targetX = this.targetEntity.x;
            targetY = this.targetEntity.y;
        }
        if (x === targetX && y === targetY) {
            this.onTargetMet();
            return;
        }
        var increment = this.speed;
        var newX = x;
        var newY = y;
        if (x < targetX) {
            newX += Math.min(increment, Math.abs(targetX - x));
        }
        if (x > targetX) {
            newX -= Math.min(increment, Math.abs(targetX - x));
        }
        if (y < targetY) {
            newY += Math.min(increment, Math.abs(targetY - y));
        }
        if (y > targetY) {
            newY -= Math.min(increment, Math.abs(targetY - y));
        }
        var distance2 = Entity.calcDistance(newX, newY, targetX, targetY);
        if (distance2 < increment) {
            newX = targetX;
            newY = targetY;
        }
        var collidedTile = this.engine.tilesContainer.collisionAt(this, newX, newY).tile;
        if (collidedTile) {
            this.onCollision(collidedTile);
            return;
        }
        this.engine.updatePosition(this, newX, newY);
        return true;
    };
    Entity.prototype.getAttackableBounds = function () {
        return new bounds_1["default"](0, 0, 0, 0);
    };
    Entity.prototype.collisionDetector = function (x, y, otherTile) {
        var targetBounds;
        if (this.lastX === x && this.lastY === y) {
            targetBounds = this.getBounds();
        }
        else {
            targetBounds = this.calcBounds(x, y);
        }
        if (otherTile.id === this.id) {
            return false;
        }
        var tileBounds = otherTile.getBounds();
        return !!targetBounds.collision(tileBounds);
    };
    Entity.prototype.onCollision = function (collidedTile) {
        if (collidedTile) { }
    };
    return Entity;
}(tile_1["default"]));
exports.__esModule = true;
exports["default"] = Entity;
//# sourceMappingURL=entity.js.map