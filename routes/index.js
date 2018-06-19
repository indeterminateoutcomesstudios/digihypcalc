var express = require("express");
var router = express.Router();


const round_dates = {
  1: new Date("2018-06-09T00:00:00Z"),
  2: new Date("2018-06-20T00:00:00Z"),
  3: new Date("2018-07-04T00:00:00Z"),
  4: new Date("2018-07-18T00:00:00Z")
};

function retrieve_players(round) {
  return new Promise((resolve, reject) => {
    console.log(round);
    console.log(typeof round);
    global.db.collection("participants").find({round}).next().then(({players: participants}) => {
      global.db.collection("players").find({id: {$in: participants}}).toArray().then(players => {
        global.db.collection("mappools").find({round}).toArray().then(mappool => {
          const mappool_hashes = [];

          for (const {hash} of mappool) {
            console.log(hash);
            mappool_hashes.push(hash);
          }

          const players_promises = [];
          for (let i = 0; i < players.length; i++) {
            const player = players[i];
            player.plays = {};
            players_promises.push(new Promise((res, rej) => {
              global.db.collection("omct_submits")
              .find({mapmd5: {$in: mappool_hashes}, date: {$gte: round_dates[round]}, playerid: player.id})
              .toArray().then(replays => {
                let replays_promises = [];
                for (let r = 0; r < replays.length; r++) {
                  const replay = replays[r];

                  replays_promises.push(new Promise((s, j) => {
                    global.db.collection("maps").find({hash: replay.mapmd5}).next().then(mapdata => {
                      replay.mapdata = mapdata;
                      player.plays[mapid] = replay;
                    });
                  }));
                }

                Promise.all(replays_promises).then(() =>{
                  res(player);
                });
              });
            }));
          }

          Promise.all(players_promises).then(players => {
            resolve(players);
          });

        });
      });
    });
  });
}


/* GET home page. */
router.get("/", function(req, res, next) {
  res.redirect("1");
});

/* GET leaderboard page. */
router.get("/:round", function(req, res, next) {

  const round = parseInt(req.params.round);
  console.log(req.params.round);
  if (round>4) {
    res.redirect("1");
  }

  console.log("got request for round #"+round);

  retrieve_players(round).then((players) => {
    console.log(players);

    // format the players for the pug template
    
    //sort the players
    players.sort(({point_total: a}, {point_total: b}) => {return a-b});
  
    // render the players using the pug template
    res.render("index", { title: `omct Round ${round} Leaderboard`, players });
  });
});

module.exports = router;

// sort players accoridng to point total
