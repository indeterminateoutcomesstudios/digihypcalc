var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  global.db.collection("players")
  .find({}).toArray().then(function(players) {


    players.forEach(function(player) {
      // replays property of player is an array
      player.replays = [];
      global.db.collection("omct_submits").toArray()
      .then(function(replays) {
        replays.forEach(function(replay){
          replay.mapdata = global.db.collection("maps").find({mapid: replay.mapid}).next();
          // push each relay into the player object with the map data
          player.replays.push(replay);
        });
      });
    });
    
    
    res.render("index", { title: "express!", players });
  });
});

module.exports = router;
