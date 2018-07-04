const osr = require("node-osr");


const href = 
"Xilver_-_Ocelot_-_TSUBAKI_fanzhens_Extreme_2016-08-10_Osu.osr";
const myosr = osr.readSync("/Users/oralekin/Downloads/"+href);

console.log(href.split("/")[href.split("/").length-1] + "\n" + myosr.beatmapMD5);