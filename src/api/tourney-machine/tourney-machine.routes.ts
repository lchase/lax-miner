import { Router } from 'express';
import { syncData } from './tourney-machine.controller';

const router = Router();

router.route('/sync').get(syncData);

export default router;