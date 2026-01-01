const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        original: "*",
    },
});

require("./socket")(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
});