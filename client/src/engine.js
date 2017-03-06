"use strict";
var color_1 = require('./color');
var tree_1 = require('./tree');
var avatar_1 = require('./avatar');
var tilescontainer_1 = require('./tilescontainer');
var bullet_1 = require("./bullet");
var explosion_1 = require("./explosion");
var message_1 = require("./message");
var Engine = (function () {
    function Engine(tilesContainer, processing, playerName) {
        this.tilesContainer = tilesContainer;
        this.processing = processing;
        this.bombs = ['!', '!', '!'];
        this.playerName = playerName;
        this.mainFont = processing.createFont("monospace", 15);
        this.largeFont = processing.createFont("monospace", 30);
        this.mouseMovedHandling = this.mouseMovedHandling.bind(this);
        this.keyHandling = this.keyHandling.bind(this);
    }
    Engine.prototype.updatePosition = function (entity, newX, newY) {
        entity.setPosition(newX, newY);
    };
    Engine.prototype.restart = function () {
        this.tilesContainer.restart();
        this.killed = false;
    };
    Engine.prototype.damage = function (target) {
        this.tilesContainer.removeTile(target);
        if (target.id === this.player.id) {
            this.restart();
        }
    };
    Engine.prototype.fireBullet = function (speed, xOffsetStart, yOffsetStart, xOffsetEnd, yOffsetEnd) {
        var man = this.player;
        var x = man.x + xOffsetStart;
        var y = man.y + yOffsetStart;
        var targetX = man.x + xOffsetEnd;
        var targetY = man.y + yOffsetEnd;
        this.client.send("F:" + x + ":" + y + ":" + targetX + ":" + targetY + ":" + speed + ":" + man.id);
    };
    Engine.prototype.keyHandling = function () {
        var keyCode = this.processing.keyCode;
        var man = this.player;
        var x = man.x;
        var y = man.y;
        var speed = 15;
        if (keyCode === 38) {
            y -= speed;
        }
        if (keyCode === 40) {
            y += speed;
        }
        if (keyCode === 37) {
            x -= speed;
        }
        if (keyCode === 39) {
            x += speed;
        }
        var bulletSpeed = 12;
        if (keyCode === 87) {
            this.fireBullet(bulletSpeed, 0, -50, 0, -300);
        }
        if (keyCode === 83) {
            this.fireBullet(bulletSpeed, 0, -50, 0, 300);
        }
        if (keyCode === 65) {
            this.fireBullet(bulletSpeed, 0, -50, -300, -50);
        }
        if (keyCode === 68) {
            this.fireBullet(bulletSpeed, 0, -50, 300, -50);
        }
        if (keyCode === 32) {
            this.bombs.shift();
        }
        // man.setTarget(x, y);
    };
    Engine.prototype.mouseMovedHandling = function () {
        var mouseX = this.processing.mouseX;
        var mouseY = this.processing.mouseY;
        if (this.sessionID) {
            this.client.send("T:" + this.sessionID + ":" + mouseX + ":" + mouseY);
        }
    };
    Engine.prototype.update = function () {
        var tilesContainer = this.tilesContainer;
        var tiles = tilesContainer.getTiles();
        var doSort = false;
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            if (tile && tile.update()) {
                doSort = true;
            }
        }
        if (doSort) {
            tilesContainer.sortTiles();
        }
        this.processing.background(0, 0, 0);
        if (!this.player) {
            this.processing.textFont(this.largeFont);
            this.processing.fill(255, 0, 0);
            this.processing.text("Waiting for connection...", this.processing.width / 2 - 140, this.processing.height / 2);
            return;
        }
        if (!this.connected) {
            this.processing.textFont(this.largeFont);
            this.processing.fill(255, 0, 0);
            this.processing.text("Lost connection", this.processing.width / 2 - 70, this.processing.height / 2);
            return;
        }
        if (this.killed) {
            this.processing.textFont(this.largeFont);
            this.processing.fill(255, 0, 0);
            this.processing.text("~YOU DIED, RIP!~", this.processing.width / 2 - 180, this.processing.height / 2);
            this.processing.text(" Final score: " + this.player.score, this.processing.width / 2 - 180, this.processing.height / 2 + 40);
            this.processing.text("Reload to try again", this.processing.width / 2 - 180, this.processing.height / 2 + 80);
            return;
        }
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            tile.render();
        }
        // score
        this.processing.textFont(this.mainFont);
        this.processing.fill(255, 0, 0);
        this.processing.text("Score " + this.player.score, 10, 30);
        var hpBars = '';
        for (var i = 0; i < this.player.hp; i++)
            hpBars += '|';
        this.processing.fill(0, 255, 0);
        this.processing.text("HP " + hpBars, 10, 50);
        var bulletBars = '';
        for (var i = 0; i < this.player.bullets; i++)
            bulletBars += '|';
        this.processing.fill(255, 255, 255);
        this.processing.text("MP " + bulletBars, 10, 70);
        if (this.hiScoreHolder) {
            this.processing.fill(255, 255, 0);
            this.processing.text("High score: " + this.hiScore + " - " + (this.hiScoreHolder === this.playerName ? "YOU!" : this.hiScoreHolder), 10, 90);
        }
        this.processing.fill(255, 0, 0);
        this.processing.text(this.bombs.join(""), this.processing.width - 100, 30);
    };
    Engine.prototype.onSocketClose = function (evt) {
        console.log("Close!", evt);
        this.connected = false;
        this.restart();
    };
    Engine.prototype.onSocketOpen = function (evt) {
        if (evt) { }
        this.restart();
        this.connected = true;
    };
    Engine.prototype.onSocketMessage = function (evt) {
        var _this = this;
        var messages = evt.data.split("\n");
        messages.forEach(function (m) {
            var opCode, data;
            _a = m.split(":"), opCode = _a[0], data = _a.slice(1);
            switch (opCode) {
                case 'ID':
                    _this.handleID(data);
                    break;
                case 'M':
                    _this.handleMove(data);
                    break;
                case 'N':
                    _this.handleNewObject(data);
                    break;
                case 'R':
                    _this.handleRemoveObject(data);
                    break;
                case 'X':
                    _this.handleExplosion(data);
                    break;
                case 'A':
                    _this.handlePlayerAttributes(data);
                    break;
                case 'K':
                    _this.handlePlayerKilled(data);
                    break;
                case 'Y':
                    _this.handleHighScore(data);
                    break;
                default:
                    break;
            }
            var _a;
        });
    };
    Engine.prototype.setClient = function (client) {
        this.client = client;
    };
    Engine.initialize = function (processing, playerName) {
        var w = window, d = w.document, de = d.documentElement, db = d.body || d.getElementsByTagName('body')[0], x = w.innerWidth || de.clientWidth || db.clientWidth, y = w.innerHeight || de.clientHeight || db.clientHeight;
        processing.size(x, y);
        var tilesContainer = new tilescontainer_1["default"]();
        var engine = new Engine(tilesContainer, processing, playerName);
        processing.keyPressed = engine.keyHandling;
        processing.mouseMoved = engine.mouseMovedHandling;
        engine.restart();
        return engine;
    };
    Engine.prototype.handleID = function (data) {
        console.log("Got ID: " + data[0]);
        this.sessionID = parseInt(data[0]);
        this.client.send("I:" + this.sessionID + ":" + this.playerName);
    };
    Engine.prototype.handleMove = function (data) {
        var objectID = data[0], x = data[1], y = data[2];
        var obj = this.tilesContainer.getTileByID(parseInt(objectID));
        if (obj) {
            obj.setPosition(parseInt(x), parseInt(y));
        }
    };
    Engine.prototype.handleExplosion = function (data) {
        var x = data[0], y = data[1], height = data[2];
        var boom = new explosion_1["default"](this.processing, this, new color_1["default"](255, 255, 255, 255), parseInt(height), 4);
        boom.setPosition(parseInt(x), parseInt(y));
        this.tilesContainer.addTile(boom);
    };
    Engine.prototype.handlePlayerAttributes = function (data) {
        var playerIDStr = data[0], scoreStr = data[1], hpStr = data[2], bulletsStr = data[3];
        var playerId = parseInt(playerIDStr);
        var tile = this.tilesContainer.getTileByID(playerId);
        if (tile) {
            var b = tile;
            b.setScore(parseInt(scoreStr));
            b.setHp(parseInt(hpStr));
            b.setBullets(parseInt(bulletsStr));
        }
    };
    Engine.prototype.handlePlayerKilled = function (data) {
        var playerIDStr = data[0];
        var playerId = parseInt(playerIDStr);
        if (this.player && this.player.id === playerId) {
            // handle killed
            this.killed = true;
        }
        var killedPlayer = this.tilesContainer.getTileByID(playerId);
        if (killedPlayer) {
            var playerAvatar = killedPlayer;
            var rip = new message_1["default"](this.processing, this, "RIP " + playerAvatar.getName(), 300);
            rip.setPosition(playerAvatar.x, playerAvatar.y);
            this.tilesContainer.addTile(rip);
        }
    };
    Engine.prototype.handleHighScore = function (data) {
        var scoreStr = data[0], holderName = data[1];
        this.hiScoreHolder = holderName;
        this.hiScore = parseInt(scoreStr);
    };
    Engine.prototype.handleRemoveObject = function (data) {
        var objectID = data[0];
        var tile = this.tilesContainer.getTileByID(parseInt(objectID));
        if (tile) {
            this.tilesContainer.removeTile(tile);
        }
    };
    Engine.prototype.handleNewObject = function (data) {
        var objectID = data[0], objectType = data[1], x = data[2], y = data[3], height = data[4], speed = data[5], name = data[6], score = data[7];
        var processing = this.processing;
        switch (objectType) {
            case 'T': {
                console.log("MAKING TREE ", x, y, "id:", objectID);
                var tree = new tree_1["default"](processing, new color_1["default"](0, processing.random(100, 200), 0, 255), parseInt(height));
                tree.id = parseInt(objectID);
                this.tilesContainer.addTile(tree);
                tree.setPosition(parseInt(x), parseInt(y));
                break;
            }
            case 'Z': {
                console.log("MAKING ZOMBIE ", x, y, "id:", objectID);
                var zombieColor = new color_1["default"](0, 55, 0, 0);
                var speedInt = parseInt(speed);
                var zombieSize = parseInt(height);
                if (speedInt > 3) {
                    zombieColor = new color_1["default"](255, 0, 0, 0);
                }
                var robot = new avatar_1["default"](this.processing, zombieColor, zombieSize);
                robot.id = parseInt(objectID);
                robot.setPosition(parseInt(x), parseInt(y));
                robot.setRole("avatar");
                this.tilesContainer.addTile(robot);
                break;
            }
            case 'B': {
                console.log("MAKING BULLET ", x, y, "id:", objectID);
                var bullet = new bullet_1["default"](processing, new color_1["default"](255, 0, 0, 0), 8);
                bullet.id = parseInt(objectID);
                bullet.setPosition(parseInt(x), parseInt(y));
                bullet.setRole("bullet");
                this.tilesContainer.addTile(bullet);
                break;
            }
            case 'P': {
                console.log("MAKING PLAYER ", x, y, "id:", objectID);
                var objectIdInt = parseInt(objectID);
                var robot = new avatar_1["default"](this.processing, new color_1["default"](238, 255, 0, 255), 103);
                robot.id = objectIdInt;
                robot.setPosition(parseInt(x), parseInt(y));
                robot.setRole("avatar");
                robot.setName(name);
                robot.setScore(parseInt(score));
                this.tilesContainer.addTile(robot);
                if (this.sessionID === objectIdInt) {
                    this.player = robot;
                }
                break;
            }
            default:
        }
    };
    return Engine;
}());
exports.__esModule = true;
exports["default"] = Engine;
//# sourceMappingURL=engine.js.map