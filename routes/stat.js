var express = require('express');
var router = express.Router();
var parser = require("../public/javascripts/parser");

async function plays( player_id, mappool, modpool, db) {
	let playertotal = 0;
	let playerpasses = 0;
	let z = 0;
	for (let m = 0; m < mappool.length; m++) {
		const mapmd5 = mappool[m];;
		const modenum = modpool[m];
		const play = await db.collection("omct_submits").find({ "playerid": player_id, mapmd5: mapmd5, mods: modenum })
			.sort({ omct_score: -1 }).next();
		if(play){playertotal += play.omct_score;
		playerpasses += 1;
		// console.log(`#${z} - ${player_id} on ${mapmd5}: ${play.omct_score}`);
		z++}
	}
	// console.log("ending", playertotal, playerpasses);
	
	return { playertotal, playerpasses };
}

/* TODO: respond to stat request for an uploaded osr
    if the request is coming from an actual page, return a view
    if the request is coming from a server just return raw json
*/

router.post("/", function (req, res) {

  // console.log("post req recieved");

  // if theres no file cant do anything
  // (shouldnt happen becuase html file upload has required attribute)
  if (!req.files) {
    res.status(400).send("Please attach a file");
    return;
  }

  let uploaded_file = req.files.osr;

  // console.log("recieved uploaded replay");
  parser(uploaded_file.data).then(replaydata => {
    // for speed, send the reply before doing db and reassignment actions

    // console.log(req.body.browser);

    if(req.body.browser) {
      res.render("upload", {title:"Upload Successful", data: replaydata});
    } else {
      res.status(200).send(replaydata);
    }
    // console.log(replaydata);
    const player = replaydata.playerdata;
    const replay = replaydata.replaydata;
    const map    = replaydata.mapdata;
    
    // put the player id and raw osr data in replaydata
    replaydata.replaydata.bin = uploaded_file.data;
    replaydata.replaydata.playerid = replaydata.playerdata.id;

    // check if the map is in the db
    global.db.collection("maps").findOne({id: map.id}, function(err, res) {
      
      if(err) {
        throw new Error("database error, failed to find in maps");
      } else if (!res) {
        global.db.collection("maps").insertOne(map);
      }

    });


    // check if the user is in the db
    global.db.collection("players").findOne({id: player.id}, function(err, res) {
      if(err) {
        throw new Error("database error, failed to find in maps");
      } else if (!res) {
        // put the user in if it wasn't in there
        global.db.collection("players").insertOne(player);
      }
    });
    
    global.db.collection("omct_submits").insertOne(replay).catch();
    
  }).catch(function(err) {
    let senderror = {error: {}};
    switch (err) {
      case "map":
        senderror.message = "Map could not be found";
        senderror.error.status = "Map Error";
        senderror.error.stack = "The map of the replay you just sent could not be found.\nPlease make sure the map hasn't been updated since you save the replay.\nIf it wasn't updated and you keep getting this error,\ncontact oralekin over Discord or email: oralekin@gmail.com.";
      break;

      case "user":
        senderror.message = "User could not be found";
        senderror.error.status = "User Error";
        senderror.error.stack = "The player of the replay you just sent could not be found.\nPlease make sure the player (you) haven't changed their username.\nIf you keep getting this error please contact oralekin over Discord or email: oralekin@gmail.com.";
        break;

      default:
        console.error("unknown error while parsing");
        console.error(err);
        senderror = err;
        break;
    }
    res.render("error", senderror);

  });
});

module.exports = router;
