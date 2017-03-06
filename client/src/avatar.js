"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tile_1 = require("./tile");
var Avatar = (function (_super) {
    __extends(Avatar, _super);
    function Avatar(processing, color, height) {
        _super.call(this, processing, "avatar");
        this.color = color;
        this.height = height;
        this.f = processing.createFont("monospace", 15);
        this.f2 = processing.createFont("monospace", 8);
    }
    Avatar.prototype.setScore = function (score) {
        this.score = score;
    };
    Avatar.prototype.getName = function () {
        return this.name;
    };
    Avatar.prototype.setHp = function (hp) {
        this.hp = hp;
    };
    Avatar.prototype.setBullets = function (bullets) {
        this.bullets = bullets;
    };
    Avatar.prototype.setName = function (name) {
        this.name = name;
    };
    Avatar.prototype.strToHex = function (str) {
        function hashCode(str) {
            var hash = 0;
            for (var i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        }
        function intToRGB(i) {
            var c = (i & 0x00FFFFFF)
                .toString(16)
                .toUpperCase();
            return "00000".substring(0, 6 - c.length) + c;
        }
        return intToRGB(hashCode(str));
    };
    Avatar.prototype.hexToRgb = function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    Avatar.prototype.render = function () {
        var height = this.height;
        var color = this.color;
        var x = this.x;
        var y = this.y - height / 2;
        this.processing.stroke(255, 255, 255);
        // head
        if (this.name) {
            var rgb = this.hexToRgb(this.strToHex(this.name));
            this.processing.fill(rgb.r, rgb.g, rgb.b);
        }
        else {
            this.processing.fill(color.r, color.g, color.b);
        }
        this.processing.ellipse(x, y, height / 4, height / 4);
        // body
        this.processing.line(x, y + height / 8, x, y + height / 3);
        this.processing.line(x - height / 6, y + height / 8, x + height / 6, y + height / 8);
        this.processing.line(x, y + height / 3, x - height / 6, y + height / 2);
        this.processing.line(x, y + height / 3, x + height / 6, y + height / 2);
        this.processing.textFont(this.f);
        this.processing.fill(255, 255, 255);
        if (this.name) {
            var hpBars = '';
            for (var i = 0; i < this.hp; i++)
                hpBars += '|';
            this.processing.fill(0, 255, 0);
            this.processing.text(this.name + " " + this.score, x - height / 4, y - height / 4 - 15);
            this.processing.textFont(this.f2);
            if (this.hp < 4) {
                this.processing.fill(255, 255, 255);
            }
            else {
                this.processing.fill(0, 255, 0);
            }
            this.processing.text(hpBars, x - height / 4, y - height / 4);
        }
    };
    Avatar.prototype.calcBounds = function (x, y) {
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
    Avatar.prototype.update = function () {
        return true;
    };
    return Avatar;
}(tile_1["default"]));
exports.__esModule = true;
exports["default"] = Avatar;
//# sourceMappingURL=avatar.js.map