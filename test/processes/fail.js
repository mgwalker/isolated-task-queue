var messagesProcessed = 0;

process.on("message", function(x) {
	setTimeout(function() {
		messagesProcessed++;
		process.send({ error: new Error("Things have gone terribly."), messages: messagesProcessed });
	}, 10);
});
