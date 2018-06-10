const express = require("express");
const router = express.Router();
const parseGetQuery = require("../public/javascripts/geturlparser");

router.get("/", function (req, res) {
  const GETparams = parseGetQuery(req.url);
  console.log(GETparams);

  let mongodbQuery = {};

  mongodbQuery["replaydata.replaymd5"] = GETparams.h ? GETparams.h : undefined; 
  global.db.collection("omct_submits").find(mongodbQuery).toArray().then(function (replays) {
    if (!replays.length) {res.status(400).send();}
    const tosend = replays[0];
    console.log(mongodbQuery);
    console.log(replays);
    global.db.collection("players")
    .find({"playerdata.id": tosend.id})
    .toArray().then(function (player) {
      const FormattedMapTitle = tosend.mapdata.artist + " - " + tosend.mapdata.title + " [" + tosend.mapdata.version + "]";
      const replayname = player.playerdata.name + FormattedMapTitle + ".osr";
      res.status(200).attachment(replayname).send(new Buffer(tosend.bin));
    });
  });
});

module.exports = router;