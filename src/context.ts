import * as tt from "telegram-typings";
import { appendFileSync } from 'fs';
import {ContextMessageUpdate as Context, Telegram} from "telegraf";

const URL_MISMATCH_TEXT_ERROR = process.env.URL_MISMATCH_TEXT_ERROR || 'Wrong url';
const URL_REGEXP = process.env.URL_REGEXP || '.*';

export class ContextExtension {
    private ctx: Context;
    private rwMsg?: tt.Message;
    private telegram: Telegram;

    constructor(ctx: Context, telegram: Telegram) {
        this.ctx = ctx;
        this.rwMsg = undefined;
        this.telegram = telegram;
    }

    private _log(text: string): void {
        let out = '';
        out += new Date().toLocaleString() + ' ';
        const {id, first_name, last_name, username } = this.ctx.chat!;
        out += `${id}, ${first_name} ${last_name}, ${username} ${text} \n`;

        console.log(out);
        appendFileSync('log.txt', out);
    }

    public async replyOnce(text: string): Promise<tt.Message> {
        return await this.ctx.reply(text, {
            reply_markup: {
                force_reply: true,
            }
        });
    }

    public log(text: string): void {
        this._log('MSG: ' + text);
    }

    public logError(text: string): void {
        this._log('[ERROR]: ' + text);
    }

    public async rewritableMessage(text: string): Promise<void> {
        if (!this.rwMsg) {
            this.rwMsg = await this.replyOnce('...');
        }
        const chatId = this.rwMsg.chat.id;
        const messageId = this.rwMsg.message_id;
        await this.telegram.editMessageText(
            chatId, messageId, messageId.toString(), text);
    }

    public clearRewritableMessage(): void {
        if (this.rwMsg) {
            this.telegram.deleteMessage(
                this.rwMsg.chat.id, this.rwMsg.message_id);
        }
    }

    public getMessageText(): string {
        return this.ctx.update.message && this.ctx.update.message.text || '';
    }

    public getUrlMismatchErrorText(): string {
        return URL_MISMATCH_TEXT_ERROR;
    }

    public isUrlMatched(): boolean {
        return new RegExp(URL_REGEXP).test(this.getMessageText());
    }

    public getBotCtx(): Context {
        return this.ctx;
    }

    public getFileName(): string {
        return this.getMessageText()
            .split('/')
            .slice(3, 7)
            .join('-') + '.pdf';
    }
}
