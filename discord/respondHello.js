export const respondHello = (message) => {
  if (message.content.startsWith("hello")) {
    message.reply("Hello");
  }
};
