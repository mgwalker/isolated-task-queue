let messagesProcessed = 0;

process.on('message', () => {
  setTimeout(() => {
    messagesProcessed += 1;
    process.send({ error: new Error('Things have gone terribly.'), messages: messagesProcessed });
  }, 10);
});
