const express = require('express');
const router = express.Router();

const transactions = require('../data/transactions');

router.get('/', (req, res) => {
    res.json(transactions);
});

router.get('/:id', (req, res) => {
    const id = Number(req.params.id);
    const transaction = transactions.find(t => t.id === id);

    if (!transaction) {
        return res.status(404).send('Not Found');
    }
    res.json(transaction);
})

router.post('/', (req, res) => {

    console.log(req.body);



    const {title, amount, category, date, description, isRecurring, type} = req.body;

    console.log({
        title: typeof title === 'string' && !!title.trim(),
        amount: typeof amount === 'number' && Number.isFinite(amount) && amount > 0,
        category: typeof category === 'string' && !!category.trim(),
        date: typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date),
        isRecurring: typeof isRecurring === 'boolean',
        type: ['income', 'expense'].includes(type),
        description: description === undefined || typeof description === 'string'
    });


    if (
        typeof title !== 'string' || !title.trim() ||
        typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 ||
        typeof category !== 'string' || !category.trim() ||
        typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        typeof isRecurring !== 'boolean' || !['income', 'expense'].includes(type) ||
        (description !== undefined && typeof description !== 'string')
    ) {
        return res.status(400).json({ message: 'Invalid transaction data' });
    }

    const transaction = {
        id: transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) : 1,
        title,
        amount,
        category,
        date,
        description,
        isRecurring,
        type
    };
    transactions.push(transaction);
    return res.status(200).send(transaction);

})


router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = transactions.findIndex(t => t.id === id);

    if(index === -1)
        return res.status(404).send('Not Found');

    const updatedTransaction = {
        ...transactions[index],
        ...req.body,
        id
    }

    transactions[index] = updatedTransaction;

    res.status(200).send(updatedTransaction);
})




router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = transactions.findIndex(t => t.id === id);

    if (index === -1)
        return res.status(404).send('Not Found');

    transactions.splice(index, 1);

    res.status(204).send();
})

module.exports = router;