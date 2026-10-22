const express = require('express');
const router = express.Router();

const db = require('../database');

router.get('/', (req, res) => {
    const transactions = db.prepare(
        'SELECT * FROM transactions'
    ).all();

    res.json(transactions.map(t => ({
        ...t,
        isRecurring: Boolean(t.isRecurring)
    })));
});

router.get('/:id', (req, res) => {
    const transaction = db.prepare(
        'SELECT * FROM transactions WHERE id = ?'
    ).get(req.params.id);

    if (!transaction) {
        return res.status(404).json({
            message: 'Transaction not found'
        });
    }

    res.json({
        ...transaction,
        isRecurring: Boolean(transaction.isRecurring)
    });
});

router.post('/', (req, res) => {
    const {
        title, amount, category, date,
        description, isRecurring, type
    } = req.body;

    if (
        typeof title !== 'string' || !title.trim() ||
        typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 ||
        typeof category !== 'string' || !category.trim() ||
        typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        typeof isRecurring !== 'boolean' ||
        !['income', 'expense'].includes(type) ||
        (description !== undefined && typeof description !== 'string')
    ) {
        return res.status(400).json({
            message: 'Invalid transaction data'
        });
    }

    const result = db.prepare(`
        INSERT INTO transactions
        (title, amount, category, date, description, isRecurring, type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        title,
        amount,
        category,
        date,
        description ?? '',
        Number(isRecurring),
        type
    );

    const transaction = {
        id: Number(result.lastInsertRowid),
        title, amount, category, date,
        description: description ?? '',
        isRecurring, type
    };

    req.app.locals.broadcast({
        event: 'transaction_created',
        transaction
    });

    res.status(201).json(transaction);
});


router.put('/:id', (req, res) => {
    const existing = db.prepare(
        'SELECT * FROM transactions WHERE id = ?'
    ).get(req.params.id);

    if (!existing) {
        return res.status(404).json({
            message: 'Transaction not found'
        });
    }

    const updated = {
        ...existing,
        ...req.body,
        id: existing.id
    };

    // Convert boolean from SQLite back to JavaScript
    if (req.body.isRecurring === undefined) {
        updated.isRecurring = Boolean(existing.isRecurring);
    }

    if (
        typeof updated.title !== 'string' || !updated.title.trim() ||
        typeof updated.amount !== 'number' || !Number.isFinite(updated.amount) || updated.amount <= 0 ||
        typeof updated.category !== 'string' || !updated.category.trim() ||
        typeof updated.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(updated.date) ||
        typeof updated.isRecurring !== 'boolean' ||
        !['income', 'expense'].includes(updated.type) ||
        typeof updated.description !== 'string'
    ) {
        return res.status(400).json({
            message: 'Invalid transaction data'
        });
    }

    db.prepare(`
        UPDATE transactions
        SET title = ?, amount = ?, category = ?, date = ?,
            description = ?, isRecurring = ?, type = ?
        WHERE id = ?
    `).run(
        updated.title,
        updated.amount,
        updated.category,
        updated.date,
        updated.description,
        Number(updated.isRecurring),
        updated.type,
        updated.id
    );

    req.app.locals.broadcast({
        event: 'transaction_updated',
        transaction: updated
    });

    res.json(updated);
});



router.delete('/:id', (req, res) => {
    const existing = db.prepare(
        'SELECT * FROM transactions WHERE id = ?'
    ).get(req.params.id);

    if (!existing) {
        return res.status(404).json({
            message: 'Transaction not found'
        });
    }

    db.prepare(
        'DELETE FROM transactions WHERE id = ?'
    ).run(req.params.id);

    req.app.locals.broadcast({
        event: 'transaction_deleted',
        transaction: {
            ...existing,
            isRecurring: Boolean(existing.isRecurring)
        }
    });

    res.status(204).send();
});
module.exports = router;