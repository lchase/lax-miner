import { existsSync, promises as fsPromises } from 'fs';
import logger from './logger';
import { Ranking } from './types';
import * as R from 'ramda';

let __data: Ranking[] = [];

const init = async (path: string) => {
    if (!existsSync(path)) {
        await fsPromises.writeFile(path, JSON.stringify([{ id: 'abc-def-hij', name: 'mdwe' }]));
    }
    __data = JSON.parse(await fsPromises.readFile(path, 'utf-8'));
};

const all = async () => {
    return __data;
}

const upsertRanking = async (ranking: Ranking) => {
    // locate by date and team name
    // If not found, then insert it
    __data.push(ranking);
}

export default {
    init,
    all,
    upsertRanking
};
