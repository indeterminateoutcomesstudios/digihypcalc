const db_things = require("../config").db_settings;
const MongoClient = require("mongodb").MongoClient;
const round = "3";
const start = new Date(1531699200);

async function plays( player_id, mappool, db ) {
	var playerround = {plays: {}, total: 0, score: 0};
	let z = 0;
	for (let m = 0; m < mappool.length; m++) {
		const map = mappool[m]
		playerround.plays[map.name] = {};


		const mapmd5 = map.map;
		const modenum = map.enum;
		const play = await db.collection("omct_submits")
			.find(
			{
				playerid	: player_id
				, mapmd5	: mapmd5
				, mods		: modenum
				, date		: {$gt: start} }
			).sort({ omct_score: -1 }).next();
			z++;
		
		if(play){
			playerround.plays[map.name] = {
				score: play.omct_score,
				hash: play.replaymd5,
			}
			playerround.total += 1;
			playerround.score += play.omct_score;
			console.log(`#${z} - ${player_id} on ${mapmd5}: ${play.omct_score}`);
		} else {
			console.log(`${player_id}: no play on ${mapmd5}`);
		}
	}
	console.log("ending", playerround.total, playerround.score);
	return playerround
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
		db.collection("participants").find({round: round}).next().then(({players: players}) => {
			//players = ["1650010"];

			db.collection("mappools").find({round: parseInt(round)}).toArray().then((mappool) => {
				for (var m = 0; m < players.length; m++) {
					const player_id = players[m];
					
					plays(player_id, mappool, db, round).then((playerround) => {
						console.log(playerround);

						const toSet = {};
						toSet[`omct.total_score.${round}`]  = playerround.score;
						toSet[`omct.numpasses.${round}`]  = playerround.total;
						toSet[`omct.rounds.${round}`] = playerround

						db.collection("players").updateMany({id: player_id}, {$set: toSet});
						console.log(`${player_id}: ${playerround.score} ${playerround.total}`);
						console.log(toSet)
					});
					

				}
			});
		});
	}
});
