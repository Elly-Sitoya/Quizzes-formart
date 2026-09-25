import { Router } from 'express';
import { getSegmentBySlug } from '../controllers/segmentsController.js';

const router = Router();

router.get('/:slug', getSegmentBySlug);

export default router;
