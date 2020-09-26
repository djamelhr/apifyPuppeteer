const Apify = require('apify');

const convertArrayToObject = (array, key) => {
    const initialValue = {};
    return array.reduce((obj, item) => {
        return {
            ...obj,
            [item[key]]: item,
        };
    }, initialValue);
};

const transpose = array => array.reduce((r, a) => a.map((v, i) => [...(r[i] || []), v]), []);
const keys = ["year", "tax_credit", "insurance", "maintenance", "repairs", "taxes_fees", "financing", "depreciation", "fuel", "true_Cost_to_Own"]
Apify.main(async () => {
    const config = await Apify.getInput();
    console.log(config);
    const browser = await Apify.launchPuppeteer({ headless: true });
    // Load https://en.wikipedia.org and get all "Did you know" texts.
    console.log('Opening web page...');
    const page = await browser.newPage();
    await page.goto("https://www.edmunds.com/tco.html");

    await page.waitFor(3000);

    await page.setViewport({ width: 1200, height: 1000 });
    await page.focus('.styled-zip-input input');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('.styled-zip-input input', config[1].zipcode, 200);
    await page.waitForSelector(".tco-page .chevron");


    const makeId = await page.evaluate(() => {
        return document.querySelectorAll(".tco-page .chevron select")[0].getAttribute('id');
    });
    await page.waitFor(500);
    await page.waitForSelector(`#${makeId}`)
    await page.focus(`#${makeId}`);
    await page.type(`#${makeId}`, config[1].make)
    await page.waitFor(1000 + Math.floor(Math.random() * 1000));

    // await page.type(" .chevron select", "2019")
    const yearId = await page.evaluate(() => {
        return document.querySelectorAll(".tco-page .chevron select")[1].getAttribute('id')
    });
    await page.waitFor(1000 + Math.floor(Math.random() * 1000));
    await page.waitForSelector(`#${yearId}`)
    await page.type(`#${yearId}`, config[1].year)
    await page.waitFor(1000 + Math.floor(Math.random() * 1000));


    const ModelId = await page.evaluate(() => {
        return document.querySelectorAll(".tco-page .chevron select")[2].getAttribute('id');
    });
    await page.waitFor(1000 + Math.floor(Math.random() * 1000));
    await page.waitForSelector(`#${ModelId}`)
    await page.type(`#${ModelId}`, config[1].model)
    await page.waitFor(1000 + Math.floor(Math.random() * 1000));



    const styleId = await page.evaluate(() => {
        return document.querySelectorAll(".tco-page .chevron select")[3].getAttribute('id');
    });
    await page.waitFor(1000 + Math.floor(Math.random() * 1000));
    await page.waitForSelector(`#${styleId}`)
    await page.type(`#${styleId}`, "LT 4DR Sedan,st-401770608-ls-fleet-4dr-sedan")
    await page.waitFor(500 + Math.floor(Math.random() * 1000));
    await page.click(".vehicle-selector a");
    await page.waitFor(3000 + Math.floor(Math.random() * 1000));
    await page.waitForSelector("table.costs-table");

    let data = await page.evaluate(() => {
        let array = [];
        document.querySelectorAll("table.costs-table").forEach((tables) => {
            if (tables.parentElement.parentElement.getAttribute("class") !== "d-none") {
                const trs = tables.querySelectorAll('tr')
                return Array.from(trs, (tr) => {
                    const tds = tr.querySelectorAll("td");
                    array.push(Array.from(tds, (td) => (td.innerText)))

                })
            }
        })
        array.shift();
        return array
    });

    data = transpose(data)
    let objects = data.map((array, index) => {
        index !== 5 ? array.unshift(`year ${index + 1}`) : array.unshift("total");
        let object = {}

        keys.forEach((key, i) => object[key] = array[i]);
        return object
    });
    let obj = convertArrayToObject(objects, 'year')
    let tcoObj = {}
    tcoObj["vehicle_info"] = config[1]
    tcoObj["tco"] = obj
    tcoObj;
    // Get all "Did you know" items from the page.

    // Save all the items to the Apify dataSet.
    await Apify.pushData(tcoObj);
    console.log('Actor finished.');

    // Close browser
    await browser.close();
});