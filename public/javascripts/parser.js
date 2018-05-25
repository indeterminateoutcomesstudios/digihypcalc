// const
const request = require("sync-request");
const osutoken = require("../../config.json").osutoken;
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



// functions
const omctscore = function omctscore(replaydata, mapdata) {
	const constant = 0.7;
	const comboratio = (mapdata.maxCombo / replaydata.combo);
	const combo_coefficient = Math.pow(0.1, 1/comboratio);
	const acc_coefficient = Math.pow(0.2, 1 / replaydata.accuracy);
	const misses = Math.pow(1.01, replaydata.num0s);
	return (constant + combo_coefficient + acc_coefficient)/misses;
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

const getvals = function getvals(data) {

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
	replaydata.mods = data.readIntLE(readerlocation, 4);
	readerlocation += 4;

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

module.exports = getvals;
exports.MODES = MODES;