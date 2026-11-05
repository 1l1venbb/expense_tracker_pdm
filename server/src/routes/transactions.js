const express = require('express');
const router = express.Router();

const db = require('../database');

// Builds the WHERE clause shared by listing and searching, always scoped
// to the authenticated user so nobody can see another user's data.
function buildFilter(userId, { search, type }) {
    const conditions = ['userId = ?'];
    const params = [userId];

    if (search && search.trim()) {
        conditions.push('(title LIKE ? OR category LIKE ? OR description LIKE ?)');
        const like = `%${search.trim()}%`;
        params.push(like, like, like);
    }

    if (type === 'income' || type === 'expense') {
        conditions.push('type = ?');
        params.push(type);
    }

    return { where: conditions.join(' AND '), params };
}

router.get('/', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);

    const { where, params } = buildFilter(req.userId, req.query);

    const total = db.prepare(
        `SELECT COUNT(*) AS count FROM transactions WHERE ${where}`
    ).get(...params).count;

    const transactions = db.prepare(`
        SELECT * FROM transactions
        WHERE ${where}
        ORDER BY date DESC, id DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, (page - 1) * limit);

    res.json({
        transactions: transactions.map(t => ({ ...t, isRecurring: Boolean(t.isRecurring) })),
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
    });
});

router.get('/:id', (req, res) => {
    const transaction = db.prepare(
        'SELECT * FROM transactions WHERE id = ? AND userId = ?'
    ).get(req.params.id, req.userId);

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
        (userId, title, amount, category, date, description, isRecurring, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        req.userId,
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
        userId: req.userId,
        title, amount, category, date,
        description: description ?? '',
        isRecurring, type
    };

    req.app.locals.broadcast(req.userId, {
        event: 'transaction_created',
        transaction
    });

    res.status(201).json(transaction);
});


router.put('/:id', (req, res) => {
    const existing = db.prepare(
        'SELECT * FROM transactions WHERE id = ? AND userId = ?'
    ).get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({
            message: 'Transaction not found'
        });
    }

    const updated = {
        ...existing,
        ...req.body,
        id: existing.id,
        userId: existing.userId
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
        WHERE id = ? AND userId = ?
    `).run(
        updated.title,
        updated.amount,
        updated.category,
        updated.date,
        updated.description,
        Number(updated.isRecurring),
        updated.type,
        updated.id,
        req.userId
    );

    req.app.locals.broadcast(req.userId, {
        event: 'transaction_updated',
        transaction: updated
    });

    res.json(updated);
});



router.delete('/:id', (req, res) => {
    const existing = db.prepare(
        'SELECT * FROM transactions WHERE id = ? AND userId = ?'
    ).get(req.params.id, req.userId);

    if (!existing) {
        return res.status(404).json({
            message: 'Transaction not found'
        });
    }

    db.prepare(
        'DELETE FROM transactions WHERE id = ? AND userId = ?'
    ).run(req.params.id, req.userId);

    req.app.locals.broadcast(req.userId, {
        event: 'transaction_deleted',
        transaction: {
            ...existing,
            isRecurring: Boolean(existing.isRecurring)
        }
    });

    res.status(204).send();
});
module.exports = router;
