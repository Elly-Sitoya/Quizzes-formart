import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import { listPublishedSets, getPublishedSet } from '../controllers/studentController.js';

const router = Router();

router.get('/sets', asyncHandler(listPublishedSets));
router.get('/sets/:id', asyncHandler(getPublishedSet));

export default router;
