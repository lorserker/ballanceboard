
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
        this.x = 638;
        this.y = 433;
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

        this.teamSize = {"red": 0, "blue": 0};

        this.scoreRed = 0;
        this.scoreBlue = 0;

        this.players = {}
    }

    this.start = function() {
        animate();
    }

    this.addPlayer = function(playerId) {
        if(this.players.length >= 4) {
            return;
        }
        var body = document.getElementById("body");
        var newPlayerCanvas = document.createElement("canvas");
        newPlayerCanvas.id = "player_" + playerId;
        newPlayerCanvas.width = 1307;
        newPlayerCanvas.height = 878;
        body.appendChild(newPlayerCanvas);

        var teamColor = "red";
        if(this.teamSize.red > this.teamSize.blue) {
            teamColor = "blue";
        }

        newPlayer = new Player();
        newPlayer.init(newPlayerCanvas, teamColor);
        newPlayer.updateVelocity(10, 10);
        this.players[playerId] = {'player': newPlayer, 'team': teamColor, 'lastUpdate': (new Date()).getTime()};
        this.teamSize[teamColor]++;
    }

    this.clearPlayers = function() {
        for(playerId in this.players) {
            this.players[playerId].player.clear();
        }
    }

    this.drawPlayers = function() {
        for(playerId in this.players) {
            this.players[playerId].player.draw();
        }
    }

    this.movePlayers = function() {
        for(playerId in this.players) {
            var anyCollisions = false;
            for(otherPlayerId in this.players) {
                if(playerId == otherPlayerId) {
                    continue;
                }
                if(this.players[playerId].player.collideWith(this.players[otherPlayerId].player)) {
                    anyCollisions = true;
                }
            }
            if(!anyCollisions) {
                this.players[playerId].player.move();
            }
        }
    }

    this.friction = function() {
        this.ball.friction();

        for(playerId in this.players) {
            this.players[playerId].player.friction();
        }
    }

    this.handleInput = function(from, x, y) {
        var now = (new Date()).getTime();
        var playerId = from;
        if(playerId in this.players) {
            var player = this.players[playerId].player;
            player.updateVelocity(x, y);
            this.players[playerId].lastUpdate = now;
        } else {
            this.addPlayer(playerId);
        }
    }

    this.deleteStalePlayers = function() {
        var now = (new Date()).getTime();
        var playersToDelete = [];
        for(playerId in this.players) {
            if(now - this.players[playerId].lastUpdate > 5000) {
                playersToDelete.push(playerId);
            }
        }
        for(var i = 0; i < playersToDelete.length; i++) {
            this.players[playersToDelete[i]].player.clear();
            this.teamSize[this.players[playersToDelete[i]].team]--;
            delete this.players[playersToDelete[i]];
        }
    }

    this.updateScore = function(incRed, incBlue) {
        this.scoreRed += incRed;
        this.scoreBlue += incBlue;

        if(this.scoreRed >= 10 || this.scoreBlue >= 10) {
            this.scoreRed = 0;
            this.scoreBlue = 0;
        }

        document.getElementById("scoreRed").innerHTML = "" + this.scoreRed;
        document.getElementById("scoreBlue").innerHTML = "" + this.scoreBlue;
    }

    this.resetPositions = function() {
        this.ball.reset();

        for(playerId in this.players) {
            this.players[playerId].player.reset();
        }
    }
}


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
        var player = game.players[playerId].player;
        if(game.ball.collidePlayer(player)) {
            break;
        }
    }

    game.ball.collideWall();

    game.ball.move();

    game.movePlayers();

    game.friction();

    game.deleteStalePlayers();

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
    var x = 3*accelData.X;
    var y = 3*accelData.Y;

    game.handleInput(accelData.From, x, y);
}

function onError(evt) {
    console.log("ws error");
}

window.addEventListener("load", wsConnect, false)