const express = require("express");
const router = express.Router();
const parseGetQuery = require("../public/javascripts/geturlparser");


// query parameter p: which page do you want
/* router.get("/lb/:round", function (req, res) {
  const GETparams = parseGetQuery(req.url);
  global.db.colection("participants").find({"round": req.params.round}).then(({players: participants}) => {
    global.db.collection("players").find({id: {$in: participants}}).sort({});
  });
  
  let mongodbQuery = {};
  
  mongodbQuery["replaydata.replaymd5"] = GETparams.h ? GETparams.h : undefined; 
  global.db.collection("omct_submits").find(mongodbQuery).toArray().then(function (replays) {
    if (!replays.length) {res.status(400).send();}
    const tosend = replays[0];
    global.db.collection("players")
    .find({"playerdata.id": tosend.id})
    .toArray().then(function (player) {
      const FormattedMapTitle = tosend.mapdata.artist + " - " + tosend.mapdata.title + " [" + tosend.mapdata.version + "]";
      const replayname = player.playerdata.name + FormattedMapTitle + ".osr";
      res.status(200).attachment(replayname).send(new Buffer(tosend.bin));
    });
  });
}); */


/* router.get("/plays/:playerid/:round", function (req, res, next) {

  if(!(req.params.playerid && req.params.round)) {res.status(500); next();}

  global.db.collection("mappool").find({round: req.params.round}).toArray().then((mappool) =>
    global.db.collection("omct_submits")
    .find({playerid:req.params.playerid, mapmd5: {$in: mappool}})
    .toArray().then((arr) => res.send(JSON.stringify(arr)))
  );

  
});

 */module.exports = router;