const express = require('express');
const cors = require('cors');
const transactionsRouter = require("./src/routes/transactions");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());


app.use('/transactions', transactionsRouter);

app.get('/', (req, res) => {
    res.json({ message: 'Expense Tracker API' });
})

app.listen(PORT, () => {
    console.log(`Listening on http:://localhost:${PORT}`);
})
