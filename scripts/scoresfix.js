const db_things = require("../config.json").db_settings;
const MongoClient = require("mongodb").MongoClient;
const osr = require("node-osr");

const mods = {
	None: 0,
	NoFail: 1,
	Easy: 2,
	Hidden: 8,
	HardRock: 16,
	SuddenDeath: 32,
	DoubleTime: 64,
	Relax: 128,
	HalfTime: 256,
	Nightcore: 512,
	Flashlight: 1024,
	Autoplay: 2048,
	SpunOut: 4096,
	Relax2: 8192,
	Perfect: 16384,
	Key4: 32768,
	Key5: 65536,
	Key6: 131072,
	Key7: 262144,
	Key8: 524288,
	FadeIn: 1048576,
	Random: 2097152,
	LastMod: 4194304,
	Key9: 16777216,
	Key10: 33554432,
	Key1: 67108864,
	Key3: 134217728,
	Key2: 268435456,
	ScoreV2: 536870912
};


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

 		db.collection("omct_submits").find({replaymd5: "9ecdc67a8e0bb76684c1c307a302e380"}).forEach(function(doc) {

			console.log("found submit");

			console.log("\n\n\n\n\n");
			db.collection("maps").find({hash: doc.mapmd5}).next().then(function(mapinfo) {
				console.log(`${doc.playername}: ${mapinfo.title}`);


				const buffer = new Buffer(doc.bin.buffer);

				const playobj = osr.readSync(buffer);
				const actualmods = modfunc(playobj.mods);

				console.log("actual? omct score:");
				const actualscore = omctscore(doc, mapinfo);

				db.collection("omct_submits").updateMany(({replaymd5: doc.replaymd5}), {
					"$set": {
						omct_score: actualscore,
						mods: actualmods
					}
				});
				i++;
				console.log(`done ${i} entries; ${new Date()}`);

				
			});
		});
 	}
});