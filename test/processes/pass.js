process.on("message", function(x) {
	setTimeout(function() {
		process.send({ worked: true });
	}, 100);
});
