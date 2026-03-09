import express from 'express';
import ConnectDB from './config/dbConnection.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import authRoutes from './routs/auth-routes.js';
import adminRoutes from './routs/admin-routes.js';
import arduinoRoutes from './routs/arduino-routes.js';
import partsRoutes from './routs/parts-routs.js';
import cors from 'cors';


const app = express();

const PORT = process.env.PORT || 3001;

//connect to mangodb
ConnectDB();

// Create temp directory if it doesn't exist
const tempPath = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath);
}

// CORS middleware - Allow requests from frontend
//need edit after deployment
app.use(cors())

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/arduino', arduinoRoutes);
app.use('/parts', partsRoutes);


app.get('/', (req, res) => {
  res.send('server is running - main branch');
});

//success
mongoose.connection.once('open', () => {
  app.listen(PORT, () => {console.log(`Server is running on : http://localhost:${PORT}`);});
});

//error
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

