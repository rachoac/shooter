var socket;
function setup() {
    createCanvas(windowWidth, windowHeight);
    socket = new Socket(document.location.host);
    socket.start();
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
function draw() {
    background(100);
    ellipse(10, 10, 10, 10);
}
var Socket = (function () {
    function Socket(host) {
        this.host = host;
    }
    Socket.prototype.start = function () {
        this.conn = new WebSocket("ws://" + document.location.host + "/ws");
        this.conn.onopen = function (evt) {
            console.log("Connected");
        };
    };
    return Socket;
}());
//# sourceMappingURL=build.js.map