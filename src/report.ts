import logger from "./logger";
import fsPromises from 'fs/promises';
import * as R from "ramda";
import moment from "moment";

const DATE_FORMAT = 'YYYY-MM-DD';

// Report on the top 10 + tracked teams.
const reportIncludes: {
    [key: string]: string[]
} = {
    '2027': [
        'Mad Dog National Black (2027)',
        'Mad Dog National Gold (2027)',
        'Mad Dog West Elite (2027)',
        'Mad Dog East Elite (2027)',
        'Mad Dog North Blue (2027)',
        'Mad Dog North Black (2027)',
        'Mad Dog Shore Black (2027)',
        'Mad Dog Shore Red (2027)',
        'Mad Dog LA (2027)',
        'Mad Dog OC (2027)',
        'Mad Dog SD (2027)',

    ],
    '2028': [
        'Mad Dog National Black (2028)',
        'Mad Dog National Gold (2028)',
        'Mad Dog West Elite (2028)',
        'GWB (2028)',
        '3D New England Red (2028)',
        'Fog City (2028)',
        'Mad Dog OC (2028)',
        'South Bay Select (2028)',
        'RC Blues (2029)',
        'Trailblazers (2028)',
        'Mad Dog LA (2028)',
        'Mad Dog SD (2028)',
        'Mad Dog Shore Red (2028)',
    ],
    '2029': [
        'Mad Dog National Black (2029)',
        'Mad Dog National Gold (2029)',
        'Mad Dog West Elite 2029',
        'Mad Dog North (2029)',
        'Mad Dog Shore (2029)',
        'Mad Dog SD (2029)',
        'Mad Dog LA (2029)'
    ]
};

const isTrackedTeam = (year: string, team: string): boolean => {
    return reportIncludes[year].includes(team);
}

const report = async (year: string) => {
    const dateCutOff = '2022-11-01';
    const storePath = `./cache/store-Boys ${year}.json`;
    
    logger.info(`Generate report for ${year}`);

    const store = JSON.parse(await fsPromises.readFile(storePath, 'utf-8'));

    // For each team, find the highest rating date
    interface ReportEntry {
        team: string,
        asOfDate: string,
        year: number,
        rank: number,
        prevRank: number,
        rankDisplay: string,
        state: string,
        record: string,
        wins: number,
        losses: number,
        ties: number,
        rating: number,
        agd: number,
        sched: number
    }
    const report: ReportEntry[] = [];

    // Find the highest date
    let dateTarget = moment(dateCutOff);
    R.forEachObjIndexed((val, key) => {
        R.forEachObjIndexed((entry, dateKey) => {
            const dateKeyMoment = moment(dateKey.toString());
            //logger.info(`${dateKeyMoment.format(DATE_FORMAT)} compared to ${dateTarget.format(DATE_FORMAT)}`)
            if (dateKeyMoment.isAfter(dateTarget)) {
                dateTarget = moment(dateKeyMoment);
            }
            //logger.info(`${dateTarget.format(DATE_FORMAT)}`)
        }, val);
    }, store);

    // Find the second to last date
    let datePreviousTarget = moment(dateCutOff);
    R.forEachObjIndexed((val, teamNameKey) => {
        R.forEachObjIndexed((entry, dateKey) => {
            const dateKeyMoment = moment(dateKey.toString());
            if (dateKeyMoment.isAfter(datePreviousTarget) && dateKeyMoment.isBefore(dateTarget)) {
                datePreviousTarget = moment(dateKeyMoment);
            }
        }, val);
    }, store);

    const targetDateKey = dateTarget.format(DATE_FORMAT);
    const targetPreviousDateKey = datePreviousTarget.format(DATE_FORMAT);
    R.forEachObjIndexed((val, key) => {
        let reportEntry: ReportEntry | null = null;
        // Identify the primary ranking entry
        R.forEachObjIndexed((rankEntry, dateKey) => {
            if (dateKey === targetDateKey) {
                reportEntry = { 
                    ...{ team: key.toString(), prevRank: -1 }, 
                    ...rankEntry
                };
            }
        }, val);

        // Find the prior week ranking if there is one
        R.forEachObjIndexed((rankEntry, dateKey) => {
            if (dateKey === targetPreviousDateKey && reportEntry !== null) {
                // Set the previous ranking
                reportEntry.prevRank = rankEntry.rank;

                if (reportEntry.prevRank !== -1) {
                    const changeInRank = reportEntry.prevRank === -1 ? 0 : reportEntry.prevRank - reportEntry.rank;
                    reportEntry.rankDisplay = `${reportEntry.rank.toString().padStart(2, '0')} (${changeInRank > 0 ? '+' : ''}${changeInRank})`;
                }
                
            }
        }, val);

        // For the ones without a prior rank at this point, just set the display to the rank
        R.forEachObjIndexed((rankEntry, dateKey) => {
            if (reportEntry !== null && reportEntry.prevRank === -1) {
                reportEntry.rankDisplay = rankEntry.rank.toString().padStart(2, '0');
            }
        }, val);

        if (reportEntry !== null) {
            report.push(reportEntry);
        }
    }, store);

    const sortedReport = R.sort<ReportEntry>((entry1: ReportEntry, entry2: ReportEntry) => {
        return entry1.rank - entry2.rank;
    }, report);

    const primaryRows: string[] = [];
    const secondaryRows: string[] = [];
    
    const additionalTrackedTeams = R.filter((e: ReportEntry) => {
       return reportIncludes[year].includes(e.team);
    }, R.without(R.take(20, sortedReport), sortedReport));

    const top20Report = R.take(20, sortedReport);

    top20Report.forEach(e => {
        let clazz = 'neutral';
        if (e.prevRank !== -1) {
            clazz = e.prevRank - e.rank > 0 ? 'positive': 'negative';
            if (e.prevRank - e.rank === 0) {
                clazz = 'neutral';
            }
        }
        const isTracked = isTrackedTeam(year, e.team);
        primaryRows.push(`
            <tr class="row ${isTracked ? 'tracked' : ''}">
                <td class="cell left ${clazz}">${e.rankDisplay}</td>
                <td class="cell left">${e.team}</td>
                <td class="cell">${e.state}</td>
                <td class="cell">${e.wins.toString().padStart(2, '0')}-${e.losses.toString().padStart(2, '0')}-${e.ties.toString().padStart(2, '0')}</td>
                <td class="cell">${e.rating}</td>
                <td class="cell">${e.agd}</td>
                <td class="cell">${e.sched}</td>
            </tr>
        `);
    });

    additionalTrackedTeams.forEach(e => {
        let clazz = '';
        if (e.prevRank !== -1) {
            clazz = e.prevRank - e.rank > 0 ? 'positive': 'negative';
            if (e.prevRank - e.rank === 0) {
                clazz = '';
            }
        }
        const isTracked = false; // isTrackedTeam(year, e.team);
        secondaryRows.push(`
            <tr class="row ${isTracked ? 'tracked' : ''}">
                <td class="cell left ${clazz}">${e.rankDisplay}</td>
                <td class="cell left">${e.team}</td>
                <td class="cell">${e.state}</td>
                <td class="cell">${e.wins.toString().padStart(2, '0')}-${e.losses.toString().padStart(2, '0')}-${e.ties.toString().padStart(2, '0')}</td>
                <td class="cell">${e.rating}</td>
                <td class="cell">${e.agd}</td>
                <td class="cell">${e.sched}</td>
            </tr>
        `);
    });

    const overallReport = R.union(top20Report, additionalTrackedTeams);

    //logger.info(store);
    console.table(overallReport, [
        'rank',
        'prevRank',
        'rankDisplay',
        'team',
        'state',
        'wins',
        'losses',
        'ties',
        'rating',
        'agd',
        'sched'
    ]);

    const htmlTemplate = await fsPromises.readFile('./template/report.htm', 'utf-8');

    await fsPromises.writeFile(`./dist/report-${year}.htm`, htmlTemplate.replace('$PLACEHOLDER', `
        <h1>${year}</h1>
        <table class="table">
            <thead>
                <tr class="row header blue">
                    <th class="cell">Rank</th>
                    <th class="cell">Team</th>
                    <th class="cell">State</th>
                    <th class="cell">Record</th>
                    <th class="cell">Rating</th>
                    <th class="cell">AGD</th>
                    <th class="cell">SS</th>
                </tr>
            </thead>
            <tbody>    
                ${primaryRows.join('\n')}
                <tr class="row divider-row"><td colspan="9" style="text-align: center;">OTHER TRACKED TEAMS</td></tr>
                ${secondaryRows.join('\n')}
            </tbody>
        </table>
    `));
};

(async () => {
    await report('2027');
    await report('2028');
    await report('2029');
})();
