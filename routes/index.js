var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  global.db.collection("players")
  .find({}).toArray().then(function(players) {


    players.forEach(function(player) {
      // replays property of player is an array
      player.replays = [];
      global.db.collection("omct_submits").find({playerid: player.id}).toArray()
      .then(function(replays) {
        replays.forEach(function(replay){
          replay.mapdata = global.db.collection("maps")
          .find({mapid: replay.mapid}).next();
          // push each relay into the player object with the map data
          player.replays.push(replay);
        });
      });
    });

    // sort the players

    // filter the players to those still i tournament
    // (under document with .name "participants" under collection "config")
    const participants = global.db.collection("config")
    .find({key: "participants"}).next();

    // FİLTER OUT MAPPOOLS BEFORE THEIR 
    const mappools = global.db.collection("mappools")
    .find({}).toArray()
    .then(function(mappoolarray){
      mappoolarray.forEach(mappool => {
        if(mappool.invalidation < new Date()) {

        }
      });
    });
    // pass mappool to the pug/jade template
  
    
    res.render("index", { title: "express!", players, mappools, participants });
  });
});

module.exports = router;
