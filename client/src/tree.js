"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tile_1 = require("./tile");
var Tree = (function (_super) {
    __extends(Tree, _super);
    function Tree(processing, color, height) {
        _super.call(this, processing, "tree");
        this.color = color;
        this.height = height;
    }
    Tree.prototype.update = function () { };
    Tree.prototype.render = function () {
        var x = this.x;
        var y = this.y;
        var height = this.height;
        var color = this.color;
        this.processing.stroke(0, 0, 0);
        this.processing.fill(102, 0, 39);
        this.processing.rect(x, y - height, height / 8, height);
        this.processing.fill(color.r, color.g, color.b);
        this.processing.ellipse(x + height / 16, y - height, height / 2, height / 2);
    };
    Tree.prototype.calcBounds = function (x, y) {
        var height = this.height;
        var boundWidth = height * 0.25;
        var boundX = x - boundWidth * 0.05;
        var boundY = y - height * 0.12;
        var boundX2 = boundX + height * 0.15;
        var boundY2 = boundY + height * 0.12;
        this.lastBounds.x1 = boundX;
        this.lastBounds.y1 = boundY;
        this.lastBounds.x2 = boundX2;
        this.lastBounds.y2 = boundY2;
        this.lastBounds.recompute();
        return this.lastBounds;
    };
    return Tree;
}(tile_1["default"]));
exports.__esModule = true;
exports["default"] = Tree;
//# sourceMappingURL=tree.js.map