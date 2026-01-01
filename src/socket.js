module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);

        socket.on("joinRoom", (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        });
    });
};