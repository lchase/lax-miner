import { Router } from 'express';
import TeamsRoutes from './teams/teams.routes';
import TourneyMachine from './tourney-machine/tourney-machine.routes';

const router = Router();

router.use('/teams', TeamsRoutes);
router.use('/tourney-machine', TourneyMachine);

export default router;
