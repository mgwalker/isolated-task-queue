var messagesProcessed = 0;

process.on("message", function(x) {
	setTimeout(function() {
		messagesProcessed++;
		process.send({ messages: messagesProcessed });
	}, 10);
});
