import logger from './logger';
import axios from 'axios';
import cheerio from 'cheerio';
import moment from 'moment';
import fs, { promises as fsPromises } from 'fs';
import { Ranking } from './types';

const minerConfig = [
    { division: 'Boys 2027', year: 2021, url: 'https://www.usclublax.com/rank?v=1027&alpha=N&y=2021' },
    { division: 'Boys 2027', year: 2022, url: 'https://www.usclublax.com/rank?v=1027&alpha=N&y=2022' },
    { division: 'Boys 2028', year: 2021, url: 'https://www.usclublax.com/rank?v=1028&alpha=N&y=2021' },
    { division: 'Boys 2028', year: 2022, url: 'https://www.usclublax.com/rank?v=1028&alpha=N&y=2022' },
    { division: 'Boys 2029', year: 2022, url: 'https://www.usclublax.com/rank?v=1029&alpha=N&y=2022' },
];

const syncRankings = async (): Promise<void> => {
    for (let idxDivision = 0; idxDivision < minerConfig.length; idxDivision++) {
        const cfg = minerConfig[idxDivision];
        logger.info(`Processing '${cfg.division}'...`);

        // Load the current store or initialize.
        const STORE_PATH = `./cache/store-${cfg.division}.json`;
        let store: Record<string, Record<string, Ranking>> = {};
        const data: Record<string, Ranking> = {};
        if (fs.existsSync(STORE_PATH)) {
            store = JSON.parse(await fsPromises.readFile(STORE_PATH, 'utf-8'));
        }

        // Can't really cache because you don't know when they update so a hit to the page is required
        // before you can see if you already have the data but you have the html already at that point

        // At some point I want to pull the games played vs. teams.

        const html = await axios.get(cfg.url);
        const $ = cheerio.load(html.data);

        const lastUpdatedText: string = $('div#rankOUT small').text().replace('Last Updated: ', '');
        const lastUpdated = moment(lastUpdatedText, 'MMM D, YYYY');
        const cacheKey = lastUpdated.format('YYYY-MM-DD');
        const CACHE_PATH = `./cache/${cfg.division}-${cacheKey}.json`
        
        logger.info(`Last Update: ${lastUpdated.format()}`);
        
        // Read through the table and read the rankings
        $("div#rankOUT tbody tr").each((i, elem) => {
            const entry: Ranking = {
                asOfDate: lastUpdated.format('YYYY-MM-DD'),
                year: cfg.year,
                rank: 1000,
                team: 'Unknown',
                state: '',
                record: '0-0-0',
                wins: 0,
                losses: 0,
                ties: 0,
                rating: 0,
                agd: 0,
                sched: 0
            };
            $(elem).children('td').each((idxCell, cell) => {
                if (idxCell === 0) entry.rank = parseInt($(cell).text());
                if (idxCell === 2) entry.team = $(cell).text();
                if (idxCell === 3) entry.state = $(cell).text();
                if (idxCell === 4) {
                    entry.record = $(cell).text();
                    const recordTokens = entry.record.split('-');
                    if (recordTokens.length > 1) entry.wins = parseInt(recordTokens[0]);
                    if (recordTokens.length >= 2) entry.losses = parseInt(recordTokens[1]);
                    if (recordTokens.length === 3) entry.ties = parseInt(recordTokens[2]);
                }
                if (idxCell === 5) entry.rating = parseFloat($(cell).text());
                if (idxCell === 6) entry.agd = parseFloat($(cell).text());
                if (idxCell === 7) entry.sched = parseFloat($(cell).text());
            });

            data[entry.team] = entry;

            if (store[entry.team] === undefined) {
                store[entry.team] = {};
            }
            store[entry.team][entry.asOfDate] = entry;
        });

        await fsPromises.writeFile(CACHE_PATH, JSON.stringify(data, null, 4));
        await fsPromises.writeFile(STORE_PATH, JSON.stringify(store, null, 4));

        /*
        

        if (fs.existsSync(cachePath)) {
            logger.info(`${parsedDate.format()} already cached, using that instead`);
            return JSON.parse(await fsPromises.readFile(cachePath, 'utf-8'));
        } else {
            $("div#rankOUT tbody tr").each((i, elem) => {
                const entry: Ranking = {
                    date: parsedDate.format('YYYY-MM-DD'),
                    rank: 1000,
                    team: null,
                    state: null,
                    record: null,
                    rating: 0,
                    agd: 0,
                    sched: 0
                };
                $(elem).children('td').each((idxCell, cell) => {
                    if (idxCell === 0) entry.rank = parseInt($(cell).text());
                    if (idxCell === 2) entry.team = $(cell).text();
                    if (idxCell === 3) entry.state = $(cell).text();
                    if (idxCell === 4) entry.record = $(cell).text();
                    if (idxCell === 5) entry.rating = parseFloat($(cell).text());
                    if (idxCell === 6) entry.agd = parseFloat($(cell).text());
                    if (idxCell === 7) entry.sched = parseFloat($(cell).text());
                });

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                data[entry.team!] = entry;

                if (store[entry.team!] === undefined) {
                    store[entry.team!] = {};
                }
                store[entry.team!][entry.date!] = entry;
            });

            await fsPromises.writeFile(cachePath, JSON.stringify(R.values(data), null, 4));
            await fsPromises.writeFile(`./cache/store.json`, JSON.stringify(store, null, 4));
            return R.values(data);
        }
        */
    }
};

(async () => {
    // await db.init('./db/data.json');
    // logger.info(await db.all());

    // Check cache, if it is in cache, use that instead.

    // If not in cache go to live page
    
    await syncRankings();

    /*
    await fsPromises.writeFile(
        `./cache/${cacheKey}.htm`, 
        $('div#rankOUT').parent().html()!
    );
    */
})();

/*
    {
        "Team A": {
            "2022-01-01": {

            }
        }
    }
*/