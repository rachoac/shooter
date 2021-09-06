
let socket

function setup() {
    createCanvas(windowWidth, windowHeight)
    socket = new Socket(document.location.host)
    socket.start()
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    background(100);
    ellipse(10, 10, 10, 10)
}