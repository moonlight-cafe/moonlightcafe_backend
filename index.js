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
const port = Config.port || 8080;

const allowedOrigins = [
    'https://moonlightcafe.vercel.app',
    'http://localhost:3000',
    'http://192.168.1.2:3000',
];

app.use((req, res, next) => {
    console.log('Request Origin:', req.headers.origin);
    next();
});

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.options('*', cors()); // preflight support

app.use(express.json({ limit: '50mb' }));
app.use(fileUpload());

app.use('/', router);

server.listen(port, '0.0.0.0', () => {
    console.log(`Node app is running on port ${port}`);
});

export { server };
