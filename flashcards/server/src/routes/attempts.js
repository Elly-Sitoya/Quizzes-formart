import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import { startAttempt, saveAnswer, finishAttempt } from '../controllers/attemptsController.js';

const router = Router();

router.post('/', asyncHandler(startAttempt));
router.post('/:id/answers', asyncHandler(saveAnswer));
router.post('/:id/finish', asyncHandler(finishAttempt));

export default router;
