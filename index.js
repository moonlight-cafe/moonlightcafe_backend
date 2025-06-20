import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import router from './Route.js';
import { Config } from './config/Init.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = Config.port || 10000;

app.use(cors({
    origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(fileUpload());

app.use('/', router);

server.listen(port, '0.0.0.0', () => {
    console.log(`Node app is running on port ${port}`);
});

export { server };
