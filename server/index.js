const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');


const transactionsRouter = require("./src/routes/transactions");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

app.locals.broadcast = (message) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};


app.use('/transactions', transactionsRouter);

app.get('/', (req, res) => {
    res.json({ message: 'Expense Tracker API' });
})

server.listen(PORT, () => {
    console.log(`Listening on http:://localhost:${PORT}`);
})
