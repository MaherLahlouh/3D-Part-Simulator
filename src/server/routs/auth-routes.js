import express from 'express';
import {register,login } from '../controller/auth-controller.js';
const router = express.Router();

router.post('/login', login);

router.post('/register', register);


export default router;