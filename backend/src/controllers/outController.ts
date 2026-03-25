import { Request, Response } from 'express';
import { mysqlPool } from '../config/db';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const [rows] = await mysqlPool.query('SELECT * FROM customer');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching customers' });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    const { store_id, first_name, last_name, email, address_id, active } = req.body;
    try {
        const [result] = await mysqlPool.query(
            'INSERT INTO customer (store_id, first_name, last_name, email, address_id, active, create_date) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [store_id, first_name, last_name, email, address_id, active]
        );
        res.json({ id: (result as any).insertId });
    } catch (error) {
        res.status(500).json({ error: 'Error creating customer' });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { store_id, first_name, last_name, email, address_id, active } = req.body;
    try {
        await mysqlPool.query(
            'UPDATE customer SET store_id=?, first_name=?, last_name=?, email=?, address_id=?, active=? WHERE customer_id=?',
            [store_id, first_name, last_name, email, address_id, active, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error updating customer' });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await mysqlPool.query('DELETE FROM customer WHERE customer_id=?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting customer' });
    }
};

export const getRentals = async (req: Request, res: Response) => {
    const [rows] = await mysqlPool.query('SELECT * FROM rental');
    res.json(rows);
};

export const createRental = async (req: Request, res: Response) => {
    const { rental_date, inventory_id, customer_id, return_date, staff_id } = req.body;
    const [result] = await mysqlPool.query(
        'INSERT INTO rental (rental_date, inventory_id, customer_id, return_date, staff_id) VALUES (?, ?, ?, ?, ?)',
        [rental_date, inventory_id, customer_id, return_date, staff_id]
    );
    res.json({ id: (result as any).insertId });
};

export const updateRental = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rental_date, inventory_id, customer_id, return_date, staff_id } = req.body;
    await mysqlPool.query(
        'UPDATE rental SET rental_date=?, inventory_id=?, customer_id=?, return_date=?, staff_id=? WHERE rental_id=?',
        [rental_date, inventory_id, customer_id, return_date, staff_id, id]
    );
    res.json({ success: true });
};

export const deleteRental = async (req: Request, res: Response) => {
    const { id } = req.params;
    await mysqlPool.query('DELETE FROM rental WHERE rental_id=?', [id]);
    res.json({ success: true });
};

export const getPayments = async (req: Request, res: Response) => {
    const [rows] = await mysqlPool.query('SELECT * FROM payment');
    res.json(rows);
};

export const createPayment = async (req: Request, res: Response) => {
    const { customer_id, staff_id, rental_id, amount, payment_date } = req.body;
    const [result] = await mysqlPool.query(
        'INSERT INTO payment (customer_id, staff_id, rental_id, amount, payment_date) VALUES (?, ?, ?, ?, ?)',
        [customer_id, staff_id, rental_id, amount, payment_date]
    );
    res.json({ id: (result as any).insertId });
};

export const updatePayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { customer_id, staff_id, rental_id, amount, payment_date } = req.body;
    await mysqlPool.query(
        'UPDATE payment SET customer_id=?, staff_id=?, rental_id=?, amount=?, payment_date=? WHERE payment_id=?',
        [customer_id, staff_id, rental_id, amount, payment_date, id]
    );
    res.json({ success: true });
};

export const deletePayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    await mysqlPool.query('DELETE FROM payment WHERE payment_id=?', [id]);
    res.json({ success: true });
};

export const getCustomerById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [rows] = await mysqlPool.query('SELECT * FROM customer WHERE customer_id = ?', [id]);
        if ((rows as any[]).length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json((rows as any[])[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching customer' });
    }
};

export const getRentalById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [rows] = await mysqlPool.query('SELECT * FROM rental WHERE rental_id = ?', [id]);
        if ((rows as any[]).length === 0) {
            return res.status(404).json({ error: 'Rental not found' });
        }
        res.json((rows as any[])[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching rental' });
    }
};

export const getPaymentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [rows] = await mysqlPool.query('SELECT * FROM payment WHERE payment_id = ?', [id]);
        if ((rows as any[]).length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json((rows as any[])[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching payment' });
    }
};