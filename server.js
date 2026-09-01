require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

// Inyectar la instancia de io en express para usarla en los controladores
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`Cliente conectado a WebSocket: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Servidor PedidoPro API corriendo en http://${HOST}:${PORT}`);
    console.log('WebSockets habilitados en tiempo real');
});
