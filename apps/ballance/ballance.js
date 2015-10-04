
var game = new Game();

function init() {
    game.init();
    game.start();
}

var imageRepository = new (function() {
    this.background = new Image();
    this.ball = new Image();

    var nImages = 2;
    var nLoaded = 0;

    function imageLoaded() {
        nLoaded++;
        if (nImages == nLoaded) {
            init();
        }
    }

    this.background.onload = function() {
        imageLoaded();
    }

    this.ball.onload = function() {
        imageLoaded();
    }

    this.background.src = "img/bg.png"
    this.ball.src = "img/ball.png"
})();

function Background() {
    this.init = function(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.draw();
    }

    this.draw = function() {
        var bgPattern = this.ctx.createPattern(imageRepository.background, "repeat");
        this.ctx.fillStyle = bgPattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function BlackHole() {
    this.init = function(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.radius = 32;
        this.x = Math.floor(Math.random() * (this.canvas.width - 2 * this.radius)) + this.radius;
        this.y = Math.floor(Math.random() * (this.canvas.height - 2 * this.radius)) + this.radius;;
        this.draw();
    } 

    this.draw = function() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        this.ctx.fillStyle = "black";
        this.ctx.fill();
    }

    this.clear = function() {
        this.ctx.clearRect(this.x - this.radius, this.y - this.radius, 2*this.radius, 2*this.radius);
    }

    this.swallows = function(other) {
        var mx = (other.x + (other.x + other.width)) / 2;
        var my = (other.y + (other.y + other.height)) / 2;

        var d = Math.sqrt(Math.pow(mx - this.x, 2) + Math.pow(my - this.y, 2));
        return d < this.radius;
    }
}

function Ball() {
    this.init = function(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.width = 32;
        this.height = 32;
        this.x = Math.floor(Math.random() * (this.canvas.width - this.width));
        this.y = Math.floor(Math.random() * (this.canvas.height - this.height));
    }

    this.draw = function() {
        this.ctx.drawImage(imageRepository.ball, this.x, this.y, this.width, this.height);
    }

    this.move = function(dx, dy) {
        this.x += dx;
        this.y += dy;
        if(this.x < 0) {
            this.x = 0;
        }
        if(this.x > this.canvas.width - this.width){
            this.x = this.canvas.width - this.width;
        }
        if(this.y < 0){
            this.y = 0;
        }
        if(this.y > this.canvas.height - this.height) {
            this.y = this.canvas.height - this.height;
        }
    }

    this.clear = function() {
        this.ctx.clearRect(this.x, this.y, this.width, this.height);
    }
}

function Game() {

    this.init = function() {
        console.log("init game");
        var bgCanvas = document.getElementById("background");
        this.background = new Background();
        this.background.init(bgCanvas, bgCanvas.getContext("2d"));

        var holeCanvas = document.getElementById("hole");
        this.hole = new BlackHole();
        this.hole.init(holeCanvas);

        var ballCanvas = document.getElementById("ball");
        this.ball = new Ball();
        this.ball.init(ballCanvas);
    }

    this.start = function() {
        animate();
    }
}

var input = {dx: 0, dy: 0};


function animate() {
    requestAnimationFrame(animate);

    game.ball.clear();

    if(game.hole.swallows(game.ball)) {
        game.hole.clear();
        game.init();
    }

    game.ball.move(input.dx, input.dy);
    render();
}

function render() {
    game.ball.draw();
}


function wsConnect() {
    websocket = new WebSocket("ws://localhost:8000/ws");
    websocket.onopen = function(evt) { onOpen(evt) };
    websocket.onclose = function(evt) { onClose(evt) };
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) };
}

function onOpen(evt) {
    console.log("connected");
}

function onClose(evt) {
    console.log("disconnected");
}

function onMessage(evt) {
    var accelData = JSON.parse(evt.data);
    accelData.X *= -1;
    input.dx = Math.round(3*accelData.X);
    input.dy = Math.round(3*accelData.Y);
}

function onError(evt) {
    console.log("ws error");
}

window.addEventListener("load", wsConnect, false)