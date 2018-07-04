var express = require("express");
var router = express.Router();

function retrieve_players(round) {
  return new Promise((resolve, reject) => {
    console.log(round);
    global.db.collection("participants").find({"round": String(round)}).next().then((participants) => {
      console.log(participants);
      ({players: participants} = participants);
      const sortCriteria = {};
      sortCriteria[`omct.total_score.${round}`] = -1;
      global.db.collection("players").find({id: {$in: participants}}).sort(sortCriteria).toArray().then(players => {
        console.log(players);
        resolve(players);
      });
    }).catch(() => resolve([]));
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
    res.render("index", { title: `omct Round ${round} Leaderboard`, players, round });
  });
});

module.exports = router;
