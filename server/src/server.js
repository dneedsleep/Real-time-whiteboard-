const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {connectDB} = require('./config.js/dbconnection.js');

// connect to database
connectDB();

const loginRoute = require('./Routes/Auth');
const RoomRoute = require('./Routes/Room.js');
const { setupWebSocket } = require('./util/ws');
const { protectRoute } = require('./middleware/auth.middleware.js');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8081;

// middleware part

app.use(express.urlencoded({extended:true}));
//app.use(protectRoute)
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true,
}));
// routes

app.use('/auth',loginRoute);
app.use('/room',RoomRoute)



// websocket
setupWebSocket(server);


server.listen(PORT,()=>{console.log(`PORT is running on ${PORT}`)});