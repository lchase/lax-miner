import logger from './logger';
import express from 'express';
import routes from './api/routes';
import compression from 'compression';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cors from 'cors';
import loggerMiddleware from './api/middlewares/logger.middleware';
import { generateToken } from './api/utils/jwt.utils';

const app = express();
const port = 3000;

if (process.env.NODE_ENV !== 'production') {
  logger.info(generateToken());
}

app.use(compression());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(loggerMiddleware);
app.use('/api/', routes);

app.listen(port, () => {
  logger.info(`Example app listening at http://localhost:${port}`);
});
