import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import { updateCard, deleteCard } from '../controllers/cardsController.js';

const router = Router();

router.put('/:id', asyncHandler(updateCard));
router.delete('/:id', asyncHandler(deleteCard));

export default router;
