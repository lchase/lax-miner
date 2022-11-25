import { sign, SignOptions } from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import settings from '../../settings';
import logger from '../../logger';

export const generateToken = () => {
  const payload = {
    name: 'Lawrence Chase',
    userId: 123,
    accessTypes: [
      'getTeams',
      'addTeams',
      'updateTeams',
      'deleteTeams'
    ]
  };

  const privateKey = fs.readFileSync(settings.privateKeyPath);

  const signInOptions: SignOptions = {
    algorithm: 'RS256',
    expiresIn: '1h'
  }

  logger.info(`Should be signing a token using private key at ${settings.privateKeyPath}`);
  const jwtToken = sign(payload, privateKey, signInOptions);
  logger.info(jwtToken);
  return jwtToken;
}