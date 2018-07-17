const express = require("express");
const router = express.Router();
const parseGetQuery = require("../public/javascripts/geturlparser");

router.get("/", function (req, res) {
  const GETparams = parseGetQuery(req.url);
  let mongodbQuery = {replaymd5: GETparams.h};
  global.db.collection("omct_submits").find(mongodbQuery).next().then(function (replay) {
    if (!replay) {res.status(400).send();}
    global.db.collection("players").find({"id": replay.playerid}).next().then((player) => {
      global.db.collection("maps").find({"hash": replay.mapmd5}).next().then((map) => {
        const FormattedMapTitle = map.artist + " - " + map.title + " [" + map.version + "]";
        const dateString = `(${replay.date.getYear()}-${replay.date.getUTCMonth()}-${replay.date.getUTCDay()})`
        const replayname = player.name + " - " + FormattedMapTitle + " " + dateString + ".osr";
        res.status(200).attachment(replayname).send((replay.bin.buffer));
      });
    });
  });
});

module.exports = router;