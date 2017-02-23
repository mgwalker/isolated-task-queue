let messagesProcessed = 0;

process.on('message', () => {
  setTimeout(() => {
    messagesProcessed += 1;
    process.send({ messages: messagesProcessed });
  }, 10);
});
