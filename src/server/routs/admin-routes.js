import express from 'express';
const router = express.Router();
import { adminDashboard } from '../controller/admin-controller.js';
import { authenticateToken } from '../middleware/auth-middleware.js';

router.use(authenticateToken);

//check if their Role is 'Admin' -------------to be added later-------------------



router.get('/dashboard', adminDashboard);


export default router;


