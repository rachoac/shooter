"use strict";
var Bounds = (function () {
    function Bounds(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.width = this.x2 - this.x1;
        this.height = this.y2 - this.y1;
    }
    Bounds.prototype.collision = function (other) {
        return !(other.x1 > this.x2 || other.x2 < this.x1 || other.y1 > this.y2 || other.y2 < this.y1);
    };
    Bounds.prototype.recompute = function () {
        this.width = this.x2 - this.x1;
        this.height = this.y2 - this.y1;
    };
    return Bounds;
}());
exports.__esModule = true;
exports["default"] = Bounds;
//# sourceMappingURL=bounds.js.map