import { NextFunction, Request, Response } from 'express';
import logger from '../../logger';

const getProcessingTimeInMS = (time: [number, number]): string => {
  return `${(time[0] * 1000 + time[1] / 1e6).toFixed(2)}ms`
}

const logMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { method, url } = req;
  const start = process.hrtime();
  const startText = `START:${getProcessingTimeInMS(start)}`;

  logger.info(`${method}:${url} ${startText}`);

  res.once('finish', () => {
    // log end of the execution process
    const end = process.hrtime(start);
    const endText = `END:${getProcessingTimeInMS(end)}`;
    console.log(`${method}:${url} ${res.statusCode} ${endText}`);
  });

  next();
}
export default logMiddleware;