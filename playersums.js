const db_things = require("./config.json").db_settings;
const MongoClient = require("mongodb").MongoClient;
const osr = require("node-osr");

const omctscore = function omctscore(replaydata, mapdata) {
	console.log("------ calc start");
	const constant = 0.7;

	const combo_score = Math.pow(0.1, parseInt(mapdata.maxCombo) / replaydata.combo);
	console.log("combo modifier: " + combo_score);

	const acc_score = Math.pow(0.2, 1 / replaydata.accuracy);
	console.log("accur modifier: " + acc_score);

	const miss_score = Math.pow(1.01, replaydata.num0s);
	console.log("misss modifier: " + miss_score);

	const top = combo_score + acc_score;
	console.log(`\n      ${top}\n0.7 + ----------------------------------\n      ${miss_score}\n`);

	console.log("final score: " + constant + (top / miss_score));
	return constant + (top / miss_score);
};

const modfunc = function modfunc(modenum) {
	console.log(modenum.toString(10));
	modenum = modenum < mods.ScoreV2 ? modenum : modenum - mods.ScoreV2;
	modenum = modenum & (~(mods.Nightcore));
	if (Boolean(modenum & (mods.HardRock | mods.DoubleTime))) {
		modenum = modenum & (~(mods.Hidden));
	};
	console.log(modenum.toString(2));
	return modenum;
};


let db;
let i = 0;

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
				
				players.forEach((player_id) => {

					var playertotal = 0; var playerpasses = 0;

					for (let i = 0; i < mapd5s.length; i++) {

						const mapmd5 = mapd5s[i];
						const modenum = modems[i];
						console.log("setting up map: " + mapmd5);

						db.collection("omct_submits").find({"playerid": player_id, mapmd5: mapmd5, mods: modenum})
						.sort({omct_score: -1}).next()
						.then((map) => {
							if(map) {
								console.log(`#${z} - ${player_id} on ${mapmd5}: ${map.omct_score}`);
								playertotal += map.omct_score;
								playerpasses += 1;
								z++;
								db.collection("players").updateMany({id: player_id}, {$set: {total_score: playertotal, numpasses: playerpasses}});
								console.log(`${player_id}: ${playertotal}, ${playerpasses}`);
							}
						});
					}
				});
			});
		});

	}
});