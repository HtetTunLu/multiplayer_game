// import Phaser from "phaser";

var config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 1520,
  height: 695,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

// window.addEventListener("load", () => {

// });

var game = new Phaser.Game(config);
let player = null;
let flg = false;
function preload() {
  this.load.image("ship", "assets/spaceShips_001.png");
  this.load.image("otherPlayer", "assets/enemyBlack5.png");
  this.load.image("star", "assets/star_gold.png");
}
function create() {
  const modal = document.querySelector(".modal");
  const overlay = document.querySelector(".overlay");
  const nameForm = document.getElementById("name-form");
  const name = document.getElementById("name");

  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");

  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.otherNames = this.physics.add.group();
  nameForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (name.value) {
      modal.classList.add("hidden");
      overlay.classList.add("hidden");
      player.name = name.value;
      console.log(player);
      addPlayername(self, player);
      flg = false;
    }
  });
  this.socket.on("currentPlayers", function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
        player = players[id];
      } else {
        addOtherPlayers(self, players[id]);
        addotherplayerNmaes(self, players[id]);
      }
    });
  });
  this.socket.on("newPlayer", function (playerInfo) {
    console.log(playerInfo);
    addOtherPlayers(self, playerInfo);
    addotherplayerNmaes(self, playerInfo);
  });
  this.socket.on("diconnectPlayer", function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
    self.otherNames.getChildren().forEach(function (otherName) {
      if (playerId === otherName.playerId) {
        otherName.destroy();
      }
    });
  });
  this.cursors = this.input.keyboard.createCursorKeys();
  this.socket.on("playerMoved", function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
    self.otherNames.getChildren().forEach(function (otherName) {
      if (playerInfo.playerId === otherName.playerId) {
        otherName.setPosition(playerInfo.name_x, playerInfo.name_y);
      }
    });
  });
  this.blueScoreText = this.add.text(16, 16, "", {
    fontSize: "32px",
    fill: "#0000FF",
  });
  this.redScoreText = this.add.text(1335, 16, "", {
    fontSize: "32px",
    fill: "#FF0000",
  });

  this.socket.on("scoreUpdate", function (scores) {
    self.blueScoreText.setText("Blue: " + scores.blue);
    self.redScoreText.setText("Red: " + scores.red);
  });
  this.socket.on("starLocation", function (starLocation) {
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, "star");
    self.physics.add.overlap(
      self.ship,
      self.star,
      function () {
        this.socket.emit("starCollected");
      },
      null,
      self
    );
  });
}
function update() {
  if (this.ship) {
    if (!flg) {
      this.socket.emit("hello", player);
      this.socket.on("done", function (flag) {
        flg = flag;
      });
    }
    if (this.cursors.left.isDown) {
      this.ship.setAngularVelocity(-150);
    } else if (this.cursors.right.isDown) {
      this.ship.setAngularVelocity(150);
    } else {
      this.ship.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(
        this.ship.rotation + 1.5,
        100,
        this.ship.body.acceleration
      );
    } else {
      this.ship.setAcceleration(0);
    }

    this.physics.world.wrap(this.ship, 5);
    // emit player movement
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    if (
      this.ship.oldPosition &&
      (x !== this.ship.oldPosition.x ||
        y !== this.ship.oldPosition.y ||
        r !== this.ship.oldPosition.rotation)
    ) {
      this.socket.emit("playerMovement", {
        x: this.ship.x,
        y: this.ship.y,
        name_x: this.ship.x - 23,
        name_y: this.ship.y - 50,
        rotation: this.ship.rotation,
      });
      this.name.x = this.ship.x - 23;
      this.name.y = this.ship.y - 50;
    }
    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      name_x: this.ship.x - 23,
      name_y: this.ship.y - 50,
      rotation: this.ship.rotation,
    };
    if (this.name) {
      this.name.x = this.ship.x - 23;
      this.name.y = this.ship.y - 50;
    }
  }
}

function addPlayer(self, playerInfo) {
  self.ship = self.physics.add
    .image(playerInfo.x, playerInfo.y, "ship")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  if (playerInfo.team === "blue") {
    self.ship.setTint(0x0000ff);
  } else {
    self.ship.setTint(0xff0000);
  }
  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.setMaxVelocity(200);
}
function addPlayername(self, playerInfo) {
  self.name = self.add.text(
    playerInfo.name_x,
    playerInfo.name_y,
    playerInfo.name,
    { fontSize: "20px" }
  );
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add
    .sprite(playerInfo.x, playerInfo.y, "otherPlayer")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  if (playerInfo.team === "blue") {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

function addotherplayerNmaes(self, playerInfo) {
  const otherName = self.add.text(
    playerInfo.name_x,
    playerInfo.name_y,
    playerInfo.name,
    { fontSize: "20px" }
  );
  otherName.playerId = playerInfo.playerId;
  self.otherNames.add(otherName);
}
