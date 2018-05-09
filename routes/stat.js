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
  let vals = parser.getvals(uploaded_file.data);

  // Use connect method to connect to the server

  global.db.collection("omct_submits")
    .insertOne({"play": vals}, function(err, result) {

    console.log("responding");

    res.status(200).send(vals);

  });

});

module.exports = router;
