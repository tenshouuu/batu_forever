const puppeteer = require('puppeteer-extra')
const anticaptcha = require("@antiadmin/anticaptchaofficial");
const axios = require('axios')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

console.log('CAPTCHA_SOLVER_KEY', process.env.CAPTCHA_SOLVER_KEY)
anticaptcha.setAPIKey(process.env.CAPTCHA_SOLVER_KEY);

const TEST_PREFIX = 'ctl00_m_g_47250b97_2d0e_4686_9b16_d0aac7a5c175_ctl00';
const VOTE_COUNT = process.env.VOTE_COUNT || 1;

function randomInt(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function createIdSelector(questionId, answerId) {
    return `#${TEST_PREFIX}_rptProfileQuestions_ctl${questionId}_question_${answerId}`
}

async function fuckCaptcha(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' })

    return anticaptcha.solveImage(Buffer.from(response.data).toString('base64'), true);
}

async function vote(browser) {
    const page = await browser.newPage()
    await page.setViewport({ width: 800, height: 600 })

    console.log(`Let's start boooooys... 🌚`);
    await page.goto('http://poll.novo-sibirsk.ru/quizing.aspx?quiz=144&cookieCheck=true')

    await page.click(createIdSelector('00', randomInt(0, 1)));

    await page.click(createIdSelector('01', randomInt(0, 5)));

    await page.click(createIdSelector('02', randomInt(0, 3)));

    await page.click(createIdSelector('03', randomInt(0, 3)));

    await page.click(createIdSelector('04', randomInt(0, 11)));


    const imgUrls = await page.$$eval(`#${TEST_PREFIX}_profileView img`, imgs => imgs.map(img => img.currentSrc));
    if (!imgUrls.length) {
        throw new Error('Captcha image is not defined!')
    }

    const code = await fuckCaptcha(imgUrls[0]);
    console.log('got fucking code', code);

    await page.type(`#${TEST_PREFIX}_txtCaptchaTextBox`, code);

    await page.click(`#${TEST_PREFIX}_lnkNextStep`);

    console.log('🙉 ❤️ 🙈 ❤️ 🙊 ❤️');
    await page.waitForSelector(`#${TEST_PREFIX}_rptQuizQuestions_ctl00_radioQuestion_1`);

    console.log('select "Baty" 🦧🦧🦧');
    await page.click(`#${TEST_PREFIX}_rptQuizQuestions_ctl00_radioQuestion_1`);

    await page.click(`#${TEST_PREFIX}_lnkSaveQuiz`);

    console.log(`Well done 😏✨`);

    // save the screen of result
    // await page.waitForTimeout(2000);
    // await page.screenshot({ path: 'stealth.png', fullPage: true })
    // console.log(`All done, check the screenshots. ✨`)
}


puppeteer.launch({ headless: true }).then(async browser => {
    for (let i = 0; i < VOTE_COUNT; i++) {
        console.log(`=== NUMBER OF VOTE ${i + 1} ===`);
        await vote(browser);
    }

    console.log(`All voting (${VOTE_COUNT}) completed successfully 🙊`);
    await browser.close();
})
