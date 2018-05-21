var express = require('express');
var router = express.Router();
var parser = require("../public/javascripts/parser");


/* TODO: respond to stat request for an uploaded osr
    if the request is coming from an actual page, return a view
    if the request is coming from a server just return raw json
*/

router.post('/', function (req, res) {

  console.log("post req recieved");

  // if theres no file cant do anything
  // (shouldnt happen becuase html file upload has required attribute)
  if (!req.files) {
    res.status(400).send("Please attach a file");
    return;
  }

  let uploaded_file = req.files.osr;
  console.log("recieved uploaded file");
  console.log(req.body);
  parser(uploaded_file.data).then(replaydata => {
    
    res.status(200).send(replaydata);
    
    replaydata.bin = uploaded_file.data;
    
    global.db.collection("omct_submits")
    .insertOne(replaydata, function(err, result) {
      console.log("responding");
    });

    global.db.collection("players").find({})
    
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
        console.log("unknown error while parsing");
        console.error(err);
        senderror = err;
        break;
    }
    res.render("error", senderror);

  });

});

module.exports = router;
