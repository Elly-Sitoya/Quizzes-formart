import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import * as sets from '../controllers/setsController.js';
import { createCard } from '../controllers/cardsController.js';

const router = Router();

router.get('/', asyncHandler(sets.listSets));
router.post('/', asyncHandler(sets.createSet));
router.get('/:id', asyncHandler(sets.getSet));
router.put('/:id', asyncHandler(sets.updateSet));
router.delete('/:id', asyncHandler(sets.deleteSet));
router.get('/:id/stats', asyncHandler(sets.getSetStats));
router.put('/:id/cards/order', asyncHandler(sets.reorderCards));
router.post('/:id/cards', asyncHandler(createCard));

export default router;
