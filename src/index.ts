const puppeteer = require('puppeteer');
const Telegraf = require('telegraf')
const fs = require('fs');
const u = require('./modules/utils');
const ContextProxy = require('./modules/context')

const REQUEST_TIMEOUT = 60000;
const KSAKEP_LOGIN_PAGE = 'https://xakep.ru/wp-login.php';
const bot = new Telegraf(process.env.TOKEN);

const USERNAME_SELECTOR = '#user_login';
const PASSWORD_SELECTOR = '#user_pass';
const BUTTON_SELECTOR = '#wp-submit';

function generatePdf(ctx) {
  return new Promise((onResolve, onReject) => {
    (async() => {
      // init
      let response, code;
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // logging
      await ctx.rewritableMessage('Logging in...');
      response = await page.goto(KSAKEP_LOGIN_PAGE, { waitUntil: 'networkidle2' });
      code = response.status();
      if (code !== 200) {
        const errorText = `${code} ${response.statusText()}`
        await ctx.rewritableMessage(errorText);
        onReject(errorText);
        return;
      }
      await page.click(USERNAME_SELECTOR);
      await page.keyboard.type(process.env.LOGIN);
      // await page.keyboard.type('test');
      await page.click(PASSWORD_SELECTOR);
      await page.keyboard.type(process.env.PASS);
      // await page.keyboard.type('test');
      await page.click(BUTTON_SELECTOR);

      const navigationResponse = await page.waitForNavigation();
      if (navigationResponse === null) {
        const errorText = `Can't loggin in, please report to @lapkoshka about this problem`;
        await ctx.rewritableMessage(errorText);

        //TODO: ctx.error method
        ctx.log(true, errorText);
      }

      // open url
      await ctx.rewritableMessage('Opening page...');
      response = await page.goto(ctx.getUserText(), { waitUntil: 'networkidle2' });
      code = response.status()
      if (code !== 200) {
        const errorText = `${code} ${response.statusText()}`;
        // TODO: log
        await ctx.rewritableMessage(errorText);
        onReject(errorText);
        return;
      }

      // Print PDF
      const pdfConfig = {
        printBackground: true,
        margin: {
          top: '2.54cm',
          bottom: '2.54cm',
          left: '2.54cm',
          right: '2.54cm'
        }
      };
      await page.emulateMedia('screen');
      await ctx.rewritableMessage('Getting PDF...');
      const file = await page.pdf(pdfConfig);
      await browser.close();
      await ctx.rewritableMessage('Sending to you');

      onResolve(file);
    })();
  })
}

function checkUser(chatData) {
  const {id, first_name, last_name, username } = chatData;
  const user = u.readUsers()[id];
  if (user) {
    const lastReq = new Date(user.time);
    if (new Date() - lastReq < REQUEST_TIMEOUT) {
      return false;
    }
  }
  
  u.writeUser({
    id,
    firstName: first_name, 
    lastName: last_name,
    username,
    time: new Date(),
  })
  
  return true;
};

function getPdf(ctx) {
  const filename = ctx.getFileName();

  return new Promise((onResolve, onReject) => {    
    if (fs.existsSync(`./articles/${filename}`)) {
      ctx.log(null, `get ${filename} from cache`);
      ctx.rewritableMessage('Getting from cache...');
      onResolve(fs.readFileSync(`./articles/${filename}`));
      return;
    }
  
    generatePdf(ctx)
      .then(file => {
        ctx.log(null, `write ${filename} to cache`);
        fs.writeFileSync(`./articles/${filename}`, file);
        onResolve(file);
      })
      .catch(err => ctx.log(err, err));
  });
}

bot.on('text', botCtx => {
  const ctx = new ContextProxy(botCtx);
  ctx.log(null, ctx.getUserText());
  if (ctx.isKsakepArticle()) {
    const status = checkUser(ctx.getBotCtx().chat);
    if (!status) {
      ctx.replyOnce(`${u.getIdiNahuyText()} by timeout`);
      ctx.log(null, 'Forbidden by timeout');
      return;
    }

    getPdf(ctx)
      .then(file => {
        ctx.getBotCtx().replyWithDocument({
          source: file,
          filename: ctx.getFileName(),
        })
        .then(msg => {
          ctx.clearRewritableMessage();
        })
        .catch(err => ctx.log(err, err));
      })
    return;
  }

  ctx.replyOnce('Ksakep article url only');
});

bot.startPolling()
