var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

var players = {};

var star = {
  x: Math.floor(Math.random() * 1330) + 50,
  y: Math.floor(Math.random() * 500) + 50,
};
var scores = {
  blue: 0,
  red: 0,
};

app.use(express.static(__dirname + "/public"));
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function (socket) {
  console.log("a user connected");
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 1330) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: Math.floor(Math.random() * 2) == 0 ? "red" : "blue",
    name: "Jhon",
  };
  players[socket.id].name_x = players[socket.id].x - 23;
  players[socket.id].name_y = players[socket.id].y - 50;
  // send the players object to the new player
  socket.emit("currentPlayers", players);
  // send the star object to the new player
  socket.emit("starLocation", star);
  // send the current scores
  socket.emit("scoreUpdate", scores);
  // update all other players of the new player
  socket.broadcast.emit("newPlayer", players[socket.id]);
  socket.on("disconnect", function () {
    console.log("user disconnected");
    // remove this player from our players object
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit("diconnectPlayer", socket.id);
  });
  socket.on("playerMovement", function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].name_x = movementData.name_x;
    players[socket.id].name_y = movementData.name_y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit("playerMoved", players[socket.id]);
  });
  socket.on("starCollected", function () {
    if (players[socket.id].team === "red") {
      scores.red += 1;
    } else {
      scores.blue += 1;
    }
    star.x = Math.floor(Math.random() * 1300) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.emit("starLocation", star);
    io.emit("scoreUpdate", scores);
  });
});

// server.listen(8081, function () {
//   console.log(`Listening on ${server.address().port}`);
// });
// exports.app = functions.https.onRequest(app);
server.listen(8081, "172.20.90.29", () => {
  console.log(`listening on 8081`);
});
