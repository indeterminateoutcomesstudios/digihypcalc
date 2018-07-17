const playerupdate = function() {

  // find all current pools in the database
  let currentpool = global.db.collection("mappools")
  .find({current: true})
  .toArray();


  global.db.collection("players").find({ in: true})
  .toArray().forEach(player => {
    global.osuapi.getUser({u: player.playerdata.id})
    .then(function (newdata) {
      console.log("updating player: " + newdata.username);
      let newplayer = {
        omctdata: player.omct_data,
        playerdata: newdata
      };

      let totalscore = 0;
      newplayer.omctdata.replays.foreach(function (replay) {
        currentpool.foreach(function (modpool) {
          if (replay.map) {
            console.log(totalscore + modpool);
          }
        });
      });

    })

    .catch(function (err) {
      console.log("couldn't get player data for player " + player.playerdata.username);
      console.error(err);
    });

  });
};

module.exports = playerupdate;