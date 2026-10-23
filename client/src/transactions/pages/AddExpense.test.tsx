import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AddExpense from './AddExpense';

// Use native inputs to exercise form behavior without Stencil hydration in jsdom.
vi.mock('@ionic/react', async importOriginal => {
    const ionic = await importOriginal<typeof import('@ionic/react')>();
    return {
        ...ionic,
        IonInput: ({ label, value, onIonInput }: {
            label: string; value: string;
            onIonInput: (event: { detail: { value: string } }) => void;
        }) => <input aria-label={label} value={value}
            onChange={event => onIonInput({ detail: { value: event.target.value } })} />
    };
});

const { addExpense } = vi.hoisted(() => ({ addExpense: vi.fn() }));
vi.mock('../TransactionProvider', () => ({
    useTransactions: () => ({ addExpense })
}));

function renderForm() {
    return render(
        <MemoryRouter initialEntries={['/transactions/new']}>
            <Routes>
                <Route path="/transactions/new" element={<AddExpense />} />
                <Route path="/transactions" element={<p>Transaction list</p>} />
            </Routes>
        </MemoryRouter>
    );
}

async function input(container: HTMLElement, label: string, value: string) {
    const element = container.querySelector(`input[aria-label="${label}"]`);
    if (!element) throw new Error(`Missing input: ${label}`);
    fireEvent.change(element, { target: { value } });
}

async function fillForm(container: HTMLElement) {
    await input(container, 'Title', ' Lunch ');
    await input(container, 'Amount (RON)', '25.50');
    await input(container, 'Category', ' Food ');
    await input(container, 'Date', '2026-10-23');
}

describe('Add expense', () => {
    beforeEach(() => { addExpense.mockReset(); });
    afterEach(cleanup);

    it('validates required fields before saving', () => {
        renderForm();
        fireEvent.submit(screen.getByRole('form', { name: 'Add expense' }));
        expect(screen.getByRole('alert').textContent).toContain('amount greater than zero');
        expect(addExpense).not.toHaveBeenCalled();
    });

    it('saves a numeric amount and trimmed fields, then returns to the list', async () => {
        addExpense.mockResolvedValue(undefined);
        const { container } = renderForm();
        await fillForm(container);
        fireEvent.submit(screen.getByRole('form', { name: 'Add expense' }));
        await screen.findByText('Transaction list');
        expect(addExpense).toHaveBeenCalledWith({
            title: 'Lunch', amount: 25.5, category: 'Food', date: '2026-10-23',
            description: '', isRecurring: false
        });
    });

    it('keeps the form available for retry after a failed save', async () => {
        addExpense.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(undefined);
        const { container } = renderForm();
        await fillForm(container);
        fireEvent.submit(screen.getByRole('form', { name: 'Add expense' }));
        await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Could not save'));
        fireEvent.submit(screen.getByRole('form', { name: 'Add expense' }));
        await screen.findByText('Transaction list');
        expect(addExpense).toHaveBeenCalledTimes(2);
    });
});
