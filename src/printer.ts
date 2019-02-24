import {Browser, Page} from 'puppeteer';
import * as puppeteer from 'puppeteer';
import { ContextExtension as Context } from "./context";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";

const PDF_CONFIG = {
  printBackground: true,
  margin: {
    top: '2.54cm',
    bottom: '2.54cm',
    left: '2.54cm',
    right: '2.54cm'
  }
};

const LOGIN_PAGE = process.env.LOGIN_PAGE || '';
const USERNAME_SELECTOR = process.env.USERNAME_SELECTOR || '';
const LOGIN = process.env.LOGIN || '';
const PASSWORD_SELECTOR = process.env.PASSWORD_SELECTOR || '';
const PASS = process.env.PASS || '';
const SUBMIT_SELECTOR = process.env.SUBMIT_SELECTOR || '';
const OWNER_TG_ACC = process.env.OWNER_TG_ACC || '';

const ARTICLES_FOLDER_NAME = 'articles';

class Printer {
  // @ts-ignore
  private browser: Browser;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  public printPdf(ctx: Context): Promise<Buffer> {
    const filename = ctx.getFileName();

    return new Promise((onResolve, onReject) => {

      const filePath = `./${ARTICLES_FOLDER_NAME}/` + filename;
      if (existsSync(filePath)) {
        ctx.log(`Get ${filename} from cache`);
        ctx.rewritableMessage('Getting from cache...');
        onResolve(readFileSync(filePath));
        return;
      }

      this.generatePdf(ctx)
        .then((file: Buffer) => {
          ctx.log(`Write ${filename} to cache`);
          if (!existsSync(`./${ARTICLES_FOLDER_NAME}`)) {
            mkdirSync(`./${ARTICLES_FOLDER_NAME}`)
          };

          writeFileSync(filePath, file);
          onResolve(file);
        })
        .catch((err: string) => ctx.logError(err));
    });
  };


  private generatePdf(ctx: Context): Promise<Buffer> {
    return new Promise(async (onResolve, onReject) => {
      const page = await this.browser.newPage();

      await ctx.rewritableMessage('Logging in...');
      const isLoggedIn = await this.logIn(ctx, page);
      if (!isLoggedIn) {
        onReject('Reject by log in fail');
        return;
      }

      const isPageOpened = await this.openPage(ctx, page);
      if (!isPageOpened) {
        onReject('Reject by opening page failed!');
        return;
      }

      await page.emulateMedia('screen');
      await ctx.rewritableMessage('Getting PDF...');
      const file = await page.pdf(PDF_CONFIG);
      await ctx.rewritableMessage('Sending to you');
      onResolve(file);
    });
  }

  private async logIn(ctx: Context, page: Page): Promise<boolean> {
    const response = await page.goto(LOGIN_PAGE, {
      waitUntil: 'networkidle2'
    });

    const code = response && response.status();
    if (code !== 200) {
      const errorText = `${code} ${response!.statusText()}`;
      await ctx.rewritableMessage(errorText);
      return false;
    }
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(LOGIN)
    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(PASS);
    await page.click(SUBMIT_SELECTOR);

    const navigationResponse = await page.waitForNavigation();
    if (navigationResponse === null) {
      const errorText = `Can't logged in, please report to ${OWNER_TG_ACC} about this problem`;
      await ctx.rewritableMessage(errorText);
      ctx.logError(errorText);
      return false;
    }
    return true;
  }

  private async openPage(ctx: Context, page: Page): Promise<boolean> {
    await ctx.rewritableMessage('Opening page...');
    const response = await page.goto(ctx.getMessageText(), {
      waitUntil: 'networkidle2'
    });
    const code = response && response.status()
    if (code !== 200) {
      const errorText = `${code} ${response!.statusText()}`;
      await ctx.rewritableMessage(errorText);
      ctx.logError(errorText);
      return false;
    }

    return true;
  }
}

export default new Printer();
