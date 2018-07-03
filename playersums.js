const db_things = require("./config.json").db_settings;
const MongoClient = require("mongodb").MongoClient;

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
		console.log(`#${z} - ${player_id} on ${mapmd5}: ${play.omct_score}`);
		z++}
	}
	console.log("ending", playertotal, playerpasses)
	
	return { playertotal, playerpasses }
}

// Connection URL
let url = db_things.ip;
let AUTHer = "";

if (db_things["auth?"]) {
	AUTHer = db_things.username + ":" + db_things.pass + "@";
}

url = db_things.protocol + AUTHer + url;

MongoClient.connect(url, function (err, client) {
	if (err) {
		console.log(err);
	} else {
		let db = client.db("omct");
		console.log("connected to db at " + db_things.ip);
		let z = 0;
		db.collection("participants").find({round: "1"}).next().then(({players: players}) => {

			db.collection("mappools").find({round: 1}).toArray().then((mps) => {
				const mapd5s = mps.map((val) => val.map);
				const modems = mps.map((val) => val.enum);

				for (var m = 0; m < players.length; m++) {
					const player_id = players[m];
					
					plays(player_id, mapd5s, modems, db).then(({ playertotal: playertotal, playerpasses: playerpasses}) => {
						console.log(playertotal);
						console.log(playerpasses);
	
						db.collection("players").updateMany({id: player_id}, {$set: {total_score: playertotal, numpasses: playerpasses}});
						console.log(`${player_id}: ${playertotal} ${playerpasses}`);
					});
					

				}
			});
		});

	}
});
