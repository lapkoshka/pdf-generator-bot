import Telegraf, { ContextMessageUpdate as Context, Telegram } from 'telegraf';
import { ContextExtension } from './context';
import { checkUser, getDeclineText } from './user';
import printer from './printer';

const telegram = new Telegram(process.env.TOKEN || '', {});
const bot = new Telegraf(process.env.TOKEN || '');

bot.on('text', (botCtx: Context) => {
  const ctx = new ContextExtension(botCtx, telegram);
  ctx.log(ctx.getMessageText());

  if (!ctx.isUrlMatched()) {
    ctx.replyOnce(ctx.getUrlMismatchErrorText());
    return;
  }

  const chat = botCtx.chat;
  if (chat) {
    const shouldBeDeclined = !checkUser(chat);
    if (shouldBeDeclined) {
      const declineText = getDeclineText();
      ctx.replyOnce(declineText);
      ctx.log(declineText);
      return;
    }
  }

  printer.printPdf(ctx)
    .then((file: Buffer) => {
      botCtx.replyWithChatAction('upload_document');
      ctx.getBotCtx().replyWithDocument({
        source: file,
        filename: ctx.getFileName(),
      })
      .then(() => ctx.clearRewritableMessage())
      .catch(err => ctx.logError(err));
    })
});

console.log('Bot started!');
bot.startPolling()
