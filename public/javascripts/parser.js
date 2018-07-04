// const
const request = require("sync-request");
const osutoken = require("../../config.json").osutoken;
const osr = require("node-osr");
const MODES = [
	"osu",
	"taiko",
	"catch",
	"mania"
];

/* 
//region
FILE FORMAT

Byte	1	A single 8 bit value.
Short	2	A 2-byte little endian value.
Integer	4	A 4-byte little endian value.
Long	8	A 8-byte little endian value.
ULEB128	Variable	A variable length integer. See ULEB128.
String	Variable	Has three parts; a single byte which will be either 0x00,
					indicating that the next two parts are not present, or 0x0b 
					(decimal 11), indicating that the next two parts are present. 
					If it is 0x0b, there will then be a ULEB128, representing 
					the byte length of the following string, and then the string 
					itself, encoded in UTF-8. See UTF-8

Byte	Game mode of the replay (0 = osu! Standard, 1 = Taiko, 2 = Catch the Beat, 3 = osu!mania)
Integer	Version of the game when the replay was created (ex. 20131216)
String	osu! beatmap MD5 hash
String	Player name
String	osu! replay MD5 hash (includes certain properties of the replay)
Short	Number of 300s
Short	Number of 100s in standard, 150s in Taiko, 100s in CTB, 200s in mania
Short	Number of 50s in standard, small fruit in CTB, 50s in mania
Short	Number of Gekis in standard, Max 300s in mania
Short	Number of Katus in standard, 100s in mania
Short	Number of misses
Integer	Total score displayed on the score report
Short	Greatest combo displayed on the score report
Byte	Perfect/full combo (1 = no misses and no slider breaks and no early finished sliders)
Integer	Mods used. See below for list of mod values.
String	Life bar graph: comma separated pairs u/v, where u is the time in milliseconds into the song and v is a floating point value from 0 - 1 that represents the amount of life you have at the given time (0 = life bar is empty, 1= life bar is full)
Long	Time stamp (Windows ticks)
Integer	Length in bytes of compressed replay data
Byte Array	Compressed replay data
Long	Unknown

//endregion
*/
const mods = {
	None: 		0,
	NoFail: 	1,
	Easy: 		2,
	Hidden: 	8,
	HardRock: 	16,
	SuddenDeath:32,
	DoubleTime: 64,
	Relax: 		128,
	HalfTime: 	256,
	Nightcore: 	512,
	Flashlight: 1024,
	Autoplay: 	2048,
	SpunOut: 	4096,
	Relax2: 	8192,
	Perfect: 	16384,
	Key4: 		32768,
	Key5: 		65536,
	Key6: 		131072,
	Key7: 		262144,
	Key8: 		524288,
	FadeIn: 	1048576,
	Random: 	2097152,
	LastMod: 	4194304,
	Key9: 		16777216,
	Key10: 		33554432,
	Key1: 		67108864,
	Key3: 		134217728,
	Key2: 		268435456,
	ScoreV2: 	536870912
};


// functions
const modfunc = function modfunc(modenum) {
	modenum = modenum < mods.ScoreV2 ? modenum : modenum - mods.ScoreV2;
	modenum = modenum & (~(mods.Nightcore));
	if (Boolean(modenum & (mods.HardRock | mods.DoubleTime))) {
		modenum = modenum & (~(mods.Hidden));
	};
	return modenum;
};

const omctscore = function omctscore(replaydata, mapdata) {
	const constant = 0.7;

	const combo_score = Math.pow(0.1, parseInt(mapdata.maxCombo) / replaydata.combo);

	const acc_score = Math.pow(0.2, 1 / replaydata.accuracy);

	const miss_score = Math.pow(1.01, replaydata.num0s);

	const top = combo_score + acc_score;

	return constant + (top / miss_score);
};

const readstringfrombeginning = function readstringfrombeginning(mybuffer) {
	let uleb  = [];
	let length = 0;
	if (mybuffer[0] === 0x00) {
		return {"value": null, "length": length};
	}
	mybuffer = mybuffer.slice(1);
	length += 1;
	

	// parse uleb to find out how long the utf8 is
	for (const byte of mybuffer) {
		uleb.push((byte.toString(2).length*"0" + byte.toString(2)).slice(1));
		length += 1;
		if (byte < 128) {
			break;
		}
	}

	let lengthofstring = parseInt(uleb.join(""), 2);
	length += lengthofstring;

	let extractedstring = mybuffer.toString("utf-8", 1, lengthofstring+1);

	// also needs to return the length of all the data
	return { "value": extractedstring, "length":  length};
};

const getvalsOld = function getvals(data) {

	let readerlocation = 0;
	let replaydata = {};

	// get the mode
	replaydata.mode = MODES[data.readIntLE(readerlocation, 1)];
	readerlocation += 1;

	// get the date
	replaydata.date = data.readIntLE(readerlocation, 4).toString();
	replaydata.date = new Date(replaydata.date.substr(0, 4),
							   replaydata.date.substr(4, 2),
							   replaydata.date.substr(6, 2)
							);
	readerlocation += 4;

	// get the map md5 hash
	replaydata.mapmd5 = readstringfrombeginning(data.slice(readerlocation));
	readerlocation += replaydata.mapmd5.length;
	replaydata.mapmd5 = replaydata.mapmd5.value;

	// get the player name
	replaydata.playername = readstringfrombeginning(data.slice(readerlocation));
	readerlocation += replaydata.playername.length;
	replaydata.playername = replaydata.playername.value;

	// get the replay md5 hash
	replaydata.replaymd5 = readstringfrombeginning(data.slice(readerlocation));
	readerlocation += replaydata.replaymd5.length;
	replaydata.replaymd5 = replaydata.replaymd5.value;

	// get the number of 300s
	replaydata.num300s = data.readIntLE(readerlocation, 2);
	readerlocation += 2;

	// get the number of 100s
	replaydata.num100s = data.readIntLE(readerlocation, 2);
	readerlocation += 2;

	// get the number of 50s
	replaydata.num50s = data.readIntLE(readerlocation, 2);
	readerlocation += 2;

	// get the number of gekis
	replaydata.numgekis = data.readIntLE(readerlocation, 2);
	readerlocation += 2;

	// get the number of katus
	replaydata.numkatus = data.readIntLE(readerlocation, 2);
	readerlocation += 2;

	// get the number of misses
	replaydata.num0s = data.readIntLE(readerlocation, 2);
	readerlocation += 2;

	// get the total score
	replaydata.score = data.readIntLE(readerlocation, 4);
	readerlocation += 4;

	// get the max combo
	replaydata.combo = data.readIntLE(readerlocation, 2);
	readerlocation += 2;

	// is play fc?
	replaydata.perfect = data.readIntLE(readerlocation, 1);
	readerlocation += 1;
	replaydata.perfect = replaydata.perfect === 1;

	// get the mods enum
	mods_enum_raw = data.readIntLE(readerlocation, 4);
	readerlocation += 4;

	replaydata.mods = modfunc(mods_enum_raw);


	replaydata.health = readstringfrombeginning(data.slice(readerlocation));
	readerlocation += replaydata.health.length;
	replaydata.health = replaydata.health.value;

	

	replaydata.accuracy = (
		(	(replaydata.num300s*300 + replaydata.num100s*100) +
		(replaydata.num50s*50 + replaydata.num0s*0))
		/
		(   (replaydata.num300s*300 + replaydata.num100s*300) +
		(replaydata.num50s*300 + replaydata.num0s*300))
	);

	return new Promise(function(res, err) {
		global.osuapi.getUser({u: replaydata.playername}).then(function (playerdata) {
			global.osuapi.getBeatmaps({h: replaydata.mapmd5}).then(function(mapdata) {
				replaydata.omct_score = omctscore(replaydata, mapdata[0]);
				res({
					replaydata,
					mapdata: mapdata[0],
					playerdata
				});
			}).catch(function(goterr){
				console.log(goterr);
				err("map");
			});
		}).catch(function(goterr){
			console.log(goterr);
			err("user");
		});
	});
};

const getvals = function getvals(data) {
	return new Promise((res, rej) => {
		const obj = osr.read(data).then((results) => {
			let replaydata = {};

			// get the mode
			replaydata.mode = MODES[results.gameMode];

			// get the date
			replaydata.date = results.timestamp;

			// get the map md5 hash
			replaydata.mapmd5 = results.beatmapMD5;

			// get the player name
			replaydata.playername = results.playerName;

			// get the replay md5 hash
			replaydata.replaymd5 = results.replayMD5;

			// get the number of 300s
			replaydata.num300s = results.number_300s;

			// get the number of 100s
			replaydata.num100s = results.number_100s;

			// get the number of 50s
			replaydata.num50s = results.number_50s;

			// get the number of gekis
			replaydata.numgekis = results.gekis;

			// get the number of katus
			replaydata.numkatus = results.katus;

			// get the number of misses
			replaydata.num0s = results.misses;

			// get the total score
			replaydata.score = results.score;

			// get the max combo
			replaydata.combo = results.max_combo;

			// is play fc?
			replaydata.perfect = Boolean(results.perfect_combo);

			// get the mods enum
			let mods_enum_raw = results.mods;

			replaydata.mods = modfunc(mods_enum_raw);


			replaydata.health = results.life_bar;



			replaydata.accuracy = (
				((replaydata.num300s * 300 + replaydata.num100s * 100) +
					(replaydata.num50s * 50 + replaydata.num0s * 0)) /
				((replaydata.num300s * 300 + replaydata.num100s * 300) +
					(replaydata.num50s * 300 + replaydata.num0s * 300))
			);

			global.osuapi.getUser({
				u: replaydata.playername
			}).then(function (playerdata) {
				global.osuapi.getBeatmaps({
					h: replaydata.mapmd5
				}).then(function (mapdata) {
					replaydata.omct_score = omctscore(replaydata, mapdata[0]);
					res({
						replaydata,
						mapdata: mapdata[0],
						playerdata
					});
				}).catch(function (goterr) {
					console.log(goterr);
					rej("map");
				});
			}).catch(function (goterr) {
				console.log(goterr);
				rej("user");
			});
		});
	});
};


module.exports = getvals;
exports.MODES = MODES;