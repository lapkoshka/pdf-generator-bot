const Telegram = require('telegraf/telegram')
const fs = require('fs');

module.exports = class ContextProxy {
    constructor(ctx) {
        this.ctx = ctx;
        this.rwMsg = undefined;
        this.telegram = new Telegram(process.env.TOKEN);
    }

    async replyOnce(text) {
        return await this.ctx.reply(text);
    }

    log(err, text) {
        let out = '';
        out += new Date().toLocaleString() + ' ';
        const {id, first_name, last_name, username } = this.ctx.chat;
        out += `${id}, ${first_name} ${last_name}, ${username}, `;
        out += err ? `[ERROR]:` : `MSG: ${text}\n`;
    
        console.log(out);
        fs.appendFileSync('log.txt', out);
    }

    async rewritableMessage(text) {
        if (!this.rwMsg) {
            this.rwMsg = await this.replyOnce('...');
        }
        await this.telegram.editMessageText(this.rwMsg.chat.id, this.rwMsg.message_id, this.rwMsg.message_id, text);
    }

    clearRewritableMessage() {
        this.telegram.deleteMessage(this.rwMsg.chat.id, this.rwMsg.message_id);
    }

    getUserText() {
        return this.ctx.update.message.text;
    }

    isKsakepArticle() {
        return /^https:\/\/xakep.ru\/[0-9]{4}\/[0-9]{2}\/[0-9]{2}\/(.*)/.test(this.getUserText());
    } 

    getBotCtx() {
        return this.ctx;
    }
    
    getFileName() {
        return this.getUserText().split('/').slice(3, 7).join('-') + '.pdf';
    }
}