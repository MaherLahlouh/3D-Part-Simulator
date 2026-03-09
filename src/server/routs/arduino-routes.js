import express from 'express';
import { compileArduinoSketch } from '../controller/arduino-controller.js';

import { authenticateToken } from '../middleware/auth-middleware.js';

const router = express.Router();

// This route is protected! Only logged-in users can use it.
router.post('/compile', authenticateToken, compileArduinoSketch);

export default router;