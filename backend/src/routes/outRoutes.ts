import { Router } from 'express';
import {
  getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer,
  getRentals, getRentalById, createRental, updateRental, deleteRental,
  getPayments, getPaymentById, createPayment, updatePayment, deletePayment
} from '../controllers/outController';

const router = Router();

router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

router.get('/rentals', getRentals);
router.get('/rentals/:id', getRentalById);
router.post('/rentals', createRental);
router.put('/rentals/:id', updateRental);
router.delete('/rentals/:id', deleteRental);

router.get('/payments', getPayments);
router.get('/payments/:id', getPaymentById);
router.post('/payments', createPayment);
router.put('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);

export default router;