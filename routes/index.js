var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(res, req, next) {
  res.redirect("/1");
});

/* GET leaderboard page. */
router.get('/:round', function(req, res, next) {
  console.log("got request for round #"+req.params.round);

  const thisroundplayers = [];

  // find the participinats still playing
  const participants = global.db.collection("participants")
  .find({round: req.params.round}).next().players;

  // get this round's mappool
  global.db.collection("mappools").find({round: req.params.round}).toArray().then(function(mappools) {
    global.db.collection("players").find({}).toArray().then(function(players) {
      // check if the player is in the participants, then load their top play for each map.
      for (let i = 0; i < players.length; i++) {
        const player = players[i];

        // ignore players that are eliminated
        if (!participants.includes(player.id)) {
          continue;
        }

        player.plays = {};

        global.db.collection("omct_submits").find({playerid: player.id}).toArray()
        .then( (replays) => {

          for (let j = 0; j < replays.length; j++) {
            const replay = replays[j];

            if (replay.id) {

            }

          }

            /**
             * check if replay is in the current mappool and if it is not, return
             */
  //          return;
            // if it is, save it in `player.`
            
            replay.mapdata = global.db.collection("maps")
            .find({mapid: replay.mapid}).next();
            
            // push each score into the player object with the map data
            player.scores.push(replay);


        });
        
      }

      // sort players accoridng to point total
      thisroundplayers.sort(({point_total: a}, {point_total: b}) => {return a-b})

      res.render("index", { title: "express!", thisroundplayers, thisroundmaps });
    
    
    });
  });
});

module.exports = router;
