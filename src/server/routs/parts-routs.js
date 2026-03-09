import express from 'express';
import {getParts, updatePart, deletePart, addPart } from '../controller/parts-controller.js';
const router = express.Router();

router.get('/', getParts);

router.patch('/:name', updatePart);

router.delete('/:name', deletePart);

router.post('/add', addPart);

export default router;