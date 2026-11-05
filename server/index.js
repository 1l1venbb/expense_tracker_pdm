require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const authRouter = require('./src/routes/auth');
const transactionsRouter = require('./src/routes/transactions');
const authenticate = require('./src/middleware/auth');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    // The client passes its JWT as a query param: ws://host?token=...
    const token = new URL(req.url, 'http://localhost').searchParams.get('token');

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        ws.userId = payload.userId;
    } catch {
        ws.close();
        return;
    }

    console.log(`WebSocket client connected (user ${ws.userId})`);

    ws.on('close', () => {
        console.log(`WebSocket client disconnected (user ${ws.userId})`);
    });
});

// Notifies only the sockets belonging to the user whose data changed.
app.locals.broadcast = (userId, message) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.userId === userId) {
            client.send(JSON.stringify(message));
        }
    });
};


app.use('/auth', authRouter);
app.use('/transactions', authenticate, transactionsRouter);

app.get('/', (req, res) => {
    res.json({ message: 'Expense Tracker API' });
})

server.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
})
