import { Router } from 'express';
import {
  startSession,
  submitAnswer,
  finishSession,
  getResults,
} from '../controllers/sessionsController.js';

const router = Router();

router.post('/', startSession);
router.post('/:id/answers', submitAnswer);
router.post('/:id/finish', finishSession);
router.get('/:id/results', getResults);

export default router;
