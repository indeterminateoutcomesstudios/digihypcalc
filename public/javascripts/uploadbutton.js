document.getElementById("file")
.addEventListener("change", function (e) {
	const label = document.getElementById("upload-button")

	var fileName = "";
	if (this.files && this.files.length > 1) {
		fileName = (this.getAttribute("data-multiple-caption") || "").replace("{count}", this.files.length);
	} else {
		fileName = e.target.value.split("\\").pop();
	}

	if (fileName){
		label.children[0].innerHTML = fileName;
	}
});