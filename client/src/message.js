"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tile_1 = require("./tile");
var Message = (function (_super) {
    __extends(Message, _super);
    function Message(processing, engine, message, turns) {
        _super.call(this, processing, "rip");
        this.engine = engine;
        this.turns = turns;
        this.currentTurns = 0;
        this.message = message;
        this.noCollision = true;
        this.f = processing.createFont("monospace", 15);
    }
    Message.prototype.render = function () {
        var x = this.x;
        var y = this.y;
        this.processing.textFont(this.f);
        this.processing.fill(this.processing.random(0, 255), this.processing.random(0, 255), this.processing.random(0, 255));
        this.processing.text(this.message, x - 50, y);
    };
    Message.prototype.update = function () {
        var tilesContainer = this.engine.tilesContainer;
        if (this.currentTurns > this.turns) {
            tilesContainer.removeTile(this);
            return true;
        }
        this.currentTurns++;
        return true;
    };
    Message.prototype.calcBounds = function (x, y) {
        if (x && y) { }
        return this.lastBounds;
    };
    return Message;
}(tile_1["default"]));
exports.__esModule = true;
exports["default"] = Message;
//# sourceMappingURL=message.js.map