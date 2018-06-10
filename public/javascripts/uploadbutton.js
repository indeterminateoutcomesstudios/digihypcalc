var uploadarea = document.getElementById("file")

uploadarea.onchange(function(e) {
	setTimeout(() => {
		document.getElementById("labmit").style.width += 1;
	}, 5000);
	
});