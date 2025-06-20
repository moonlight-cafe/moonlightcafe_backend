import dotenv1 from "dotenv"
import express from 'express'
import router from './Route.js'
import http from 'http'
import cors from 'cors'
import fileUpload from 'express-fileupload'
import { Config } from "./config/Init.js"

dotenv1.config()
const port = Config.port

const app = express()
const server = http.createServer(app)

app.use(cors({
    origin: "",
    // credentials: true
}));
app.use(fileUpload());
app.use(express.json({ limit: '50mb' }))
app.use("/", router)//API ROUTES

server.listen(port, '0.0.0.0', function () {
    console.log('Node app is running on port ' + port)
})

export { server }