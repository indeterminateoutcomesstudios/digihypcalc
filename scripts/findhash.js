const osr = require("node-osr");
const fs = require("fs");

fs.readdir(".", (err, files) => {
	files.forEach(function(href) {
		const myosr = osr.readSync(process.cwd()+"/"+href);
		console.log(href.split("/")[href.split("/").length-1] + "\n" + myosr.beatmapMD5);
	});
});