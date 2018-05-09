var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  let players = []

  for(let i = 0; i < 10; i++) {
    players.push({
      name: "player"+i,
      id: i
    });
  }

  res.render('index', 
    { title: "express!",
      players
    }
  );
});

module.exports = router;
