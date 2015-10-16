
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

    this.background.src = "img/field.jpg"
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

function Player() {
    this.init = function(canvas, teamColor) {
        this.canvas = canvas;
        this.teamColor = teamColor;
        this.ctx = this.canvas.getContext("2d");
        this.radius = 32;
        this.reset();
    }

    this.reset =function() {
        if(this.teamColor == "red") {
            this.x = Math.floor(Math.random() * (this.canvas.width - 2 * this.radius)/2) + this.radius;
            this.y = Math.floor(Math.random() * (this.canvas.height - 2 * this.radius)/2) + this.radius;
        } else {
            this.x = (this.canvas.width - 2 * this.radius)/2 + Math.floor(Math.random() * (this.canvas.width - 2 * this.radius)/2) + this.radius;
            this.y = (this.canvas.height - 2 * this.radius)/2 + Math.floor(Math.random() * (this.canvas.height - 2 * this.radius)/2) + this.radius;
        }
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.dx = 0;
        this.dy = 0;
    }

    this.draw = function() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        this.ctx.fillStyle = this.teamColor;
        this.ctx.fill();
    }

    this.clear = function() {
        this.ctx.clearRect(this.x - this.radius, this.y - this.radius, 2*this.radius, 2*this.radius);
    }

    this.friction = function() {
        this.dx = this.dx * 0.9;
        this.dy = this.dy * 0.9;
    }

    this.updateVelocity = function(dx, dy) {
        this.dx = dx;
        this.dy = dy;
    }

    this.move = function() {
        this.x += Math.round(this.dx);
        this.y += Math.round(this.dy);

        if(this.x < this.radius) {
            this.x = this.radius;
        }

        if(this.x > this.canvas.width - this.radius) {
            this.x = this.canvas.width - this.radius;
        }

        if(this.y < this.radius) {
            this.y = this.radius;
        }

        if(this.y > this.canvas.height - this.radius) {
            this.y = this.canvas.height - this.radius;
        }
    }

    this.collideWith = function(other) {
        var d = Math.sqrt(Math.pow(this.x + this.dx - other.x, 2) + Math.pow(this.y + this.dy - other.y, 2));
        return (d < 2*this.radius);
    }
}

function Ball() {
    this.init = function(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.width = 32;
        this.height = 32;
        this.reset();
    }

    this.reset = function() {
        //this.x = Math.floor(Math.random() * (this.canvas.width - this.width));
        //this.y = Math.floor(Math.random() * (this.canvas.height - this.height));
        this.x = 648;
        this.y = 436;
        this.dx = 0;
        this.dy = 0;
    }

    this.draw = function() {
        this.ctx.drawImage(imageRepository.ball, this.x, this.y, this.width, this.height);
    }

    this.friction = function() {
        this.dx = this.dx * 0.98;
        this.dy = this.dy * 0.98;
    }

    this.move = function() {
        this.x += Math.round(this.dx);
        this.y += Math.round(this.dy);

        if (this.x < 0) {
            this.x = 0;
        }
        if(this.x > this.canvas.width - this.width) {
            this.x = this.canvas.width - this.width;
        }
        if(this.y < 0) {
            this.y = 0;
        }
        if(this.y > this.canvas.height - this.height) {
            this.y = this.canvas.height - this.height;
        }

    }

    this.clear = function() {
        this.ctx.clearRect(this.x, this.y, this.width, this.height);
    }

    this.collidePlayer = function(player) {
        var mx = (this.x + (this.x + this.width)) / 2;
        var my = (this.y + (this.y + this.height)) / 2;

        var d = Math.sqrt(Math.pow(mx - player.x, 2) + Math.pow(my - player.y, 2));

        if(d < player.radius + this.width) {
            this.dx = 2*player.dx;
            this.dy = 2*player.dy;

            return true;
        }
        return false;
    }

    this.isInRedGoal = function() {
        if(this.x > 5) {
            return false;
        }
        if(this.y >= 325 && this.y < 550) {
            return true;
        }
        return false;
    }

    this.isInBlueGoal = function() {
        if(this.x < this.canvas.width - this.width - 5) {
            return false;
        }
        if(this.y >= 325 && this.y < 550) {
            return true;
        }
        return false;
    }

    this.collideWall = function() {
        if (this.x < 5) {
            this.dx = -this.dx * 0.8;
            return true;
        }
        if(this.x > this.canvas.width - this.width - 5){
            this.dx = -this.dx * 0.8;
            return true;
        }

        if(this.y < 5){
            hitWall = true;
            this.dy = -this.dy * 0.8;
        }

        if(this.y > this.canvas.height - this.height - 5) {
            this.dy = -this.dy * 0.8;
            return true;
        }

        return false;
    }
}

function Game() {

    this.init = function() {
        console.log("init game");
        var bgCanvas = document.getElementById("background");
        this.background = new Background();
        this.background.init(bgCanvas, bgCanvas.getContext("2d"));

        var ballCanvas = document.getElementById("ball");
        this.ball = new Ball();
        this.ball.init(ballCanvas);

        this.teamRed = []
        this.teamBlue = []

        this.scoreRed = 0;
        this.scoreBlue = 0;

        this.players = {}
    }

    this.start = function() {
        animate();
    }

    this.addPlayer = function(playerId) {
        var body = document.getElementById("body");
        var newPlayerCanvas = document.createElement("canvas");
        newPlayerCanvas.id = "player_" + playerId;
        newPlayerCanvas.width = 1307;
        newPlayerCanvas.height = 878;
        body.appendChild(newPlayerCanvas);

        var teamColor = "red";
        var team = this.teamRed;

        if(this.teamRed.length > this.teamBlue.length) {
            teamColor = "blue";
            team = this.teamBlue;
        }

        newPlayer = new Player();
        newPlayer.init(newPlayerCanvas, teamColor);
        newPlayer.updateVelocity(10, 10);
        team.push(newPlayer);
        this.players[playerId] = newPlayer;
    }

    this.clearPlayers = function() {
        this.clearTeam(this.teamRed);
        this.clearTeam(this.teamBlue);
    }

    this.clearTeam = function(team) {
        for(var i = 0; i < team.length; i++) {
            team[i].clear();
        }
    }

    this.drawPlayers = function() {
        this.drawTeam(this.teamRed);
        this.drawTeam(this.teamBlue);
    }

    this.drawTeam = function(team) {
        for(var i = 0; i < team.length; i++) {
            team[i].draw();
        }
    }

    this.movePlayers = function() {
        // for(var i = 0; i < this.teamRed.length; i++) {
        //     this.teamRed[i].move();
        // }
        // for(var i = 0; i < this.teamBlue.length; i++) {
        //     this.teamBlue[i].move();
        // }

        for(playerId in this.players) {
            var anyCollisions = false;
            for(otherPlayerId in this.players) {
                if(playerId == otherPlayerId) {
                    continue;
                }
                if(this.players[playerId].collideWith(this.players[otherPlayerId])) {
                    anyCollisions = true;
                }
            }
            if(!anyCollisions) {
                this.players[playerId].move();
            }
        }
    }

    this.friction = function() {
        this.ball.friction();

        for(var i = 0; i < this.teamRed.length; i++) {
            this.teamRed[i].friction();
        }

        for(var i = 0; i < this.teamBlue.length; i++) {
            this.teamBlue[i].friction();
        }
    }

    this.handleInput = function(from, x, y) {
        var playerId = from;
        if(playerId in this.players) {
            var player = this.players[playerId];
            player.updateVelocity(x, y);
        } else {
            this.addPlayer(playerId);
        }
    }

    this.updateScore = function(incRed, incBlue) {
        this.scoreRed += incRed;
        this.scoreBlue += incBlue;

        document.getElementById("scoreRed").innerHTML = "" + this.scoreRed;
        document.getElementById("scoreBlue").innerHTML = "" + this.scoreBlue;
    }

    this.resetPositions = function() {
        this.ball.reset();

        for(var i = 0; i < this.teamRed.length; i++) {
            this.teamRed[i].reset();
        }

        for(var i = 0; i < this.teamBlue.length; i++) {
            this.teamBlue[i].reset();
        }
    }
}

var inputBall = {dx: 0, dy: 0};
var inputHole = {dx: 0, dy: 0};

var ballId = null;


function animate() {
    requestAnimationFrame(animate);

    game.clearPlayers();
    game.ball.clear();

    var goal = false;
    if(game.ball.isInRedGoal()) {
        goal = true;
        game.updateScore(0, 1);
    }
    if(game.ball.isInBlueGoal()) {
        goal = true;
        game.updateScore(1, 0);
    }
    if(goal) {
        game.resetPositions();
    }

    for(playerId in game.players) {
        player = game.players[playerId];
        if(game.ball.collidePlayer(player)) {
            break;
        }
    }

    game.ball.collideWall();

    game.ball.move();

    game.movePlayers();

    game.friction();

    render();
}

function render() {
    game.ball.draw();
    game.drawPlayers();
}


function wsConnect() {
    var serverAddr = location.search.split("server=")[1];
    websocket = new WebSocket("ws://" + serverAddr + "/ws");
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

var nMessages = 0;

function onMessage(evt) {
    nMessages++;
    if(nMessages % 1000 == 0) {
        console.log(nMessages);
    } 
    var accelData = JSON.parse(evt.data);

    accelData.X *= -1;
    var x = 2*accelData.X;
    var y = 2*accelData.Y;

    game.handleInput(accelData.From, x, y);
}

function onError(evt) {
    console.log("ws error");
}

window.addEventListener("load", wsConnect, false)