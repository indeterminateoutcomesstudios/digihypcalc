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
    global.db.collection("participants").find({"round": String(round)}).next().then((participants) => {
      console.log(participants);
      ({players: participants} = participants);
      global.db.collection("players").find({id: {$in: participants}}).sort({total_score: -1}).toArray().then(players => {
        resolve(players);
      });
    });
  });
}

/* GET home page. */
router.get("/", function(req, res) {
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
      
    // render the players using the pug template
    res.render("index", { title: `omct Round ${round} Leaderboard`, players });
  });
});

module.exports = router;

// sort players accoridng to point total
