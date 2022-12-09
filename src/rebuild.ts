import logger from "./logger";
import fs from 'fs';
import fsPromises from 'fs/promises';
import { Ranking } from "./types";

const minerConfig = [
    { division: 'Boys 2027', year: 2021, url: 'https://www.usclublax.com/rank?v=1027&alpha=N&y=2021' },
    { division: 'Boys 2027', year: 2022, url: 'https://www.usclublax.com/rank?v=1027&alpha=N&y=2022' },
    { division: 'Boys 2028', year: 2021, url: 'https://www.usclublax.com/rank?v=1028&alpha=N&y=2021' },
    { division: 'Boys 2028', year: 2022, url: 'https://www.usclublax.com/rank?v=1028&alpha=N&y=2022' },
    { division: 'Boys 2029', year: 2022, url: 'https://www.usclublax.com/rank?v=1029&alpha=N&y=2022' },
];

export const rebuildStoreFromCache = async () => {
    logger.info('Rebuilding stores from cache');
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
        logger.info(JSON.stringify(store, null, 4));
    }
};

(async () => {
    await rebuildStoreFromCache();
})();