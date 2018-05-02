var express = require('express');
var router = express.Router();
var parser = require("../public/javascripts/parser");


/* TODO: respond to stat request for an uploaded osr
    if the request is coming from an actual page, return a view
    if the request is coming from a server just return raw json
*/

router.post('/', function (req, res) {
  
  console.log("post req recieved");
  let uploaded_file = req.files.osr;
  console.log("recieved uploaded file");
  console.log(req.body)
  let vals = parser.getvals(uploaded_file.data)
  
  console.log("responding")
  
  if(req.body.browser == "true") {



    res.render('stat', { title: 'Express' });
  } else {
    res.status(200).send(vals);
  }
  
  
});

router.use('/', function (req, res, next) {
  console.log("sometihng")
  // get leaderboards from database
  lb = {} //leaderboard_object
  res.render('stat', { title: 'Express' , lb: lb});
});


module.exports = router;
