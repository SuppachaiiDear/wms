const express = require('express');
const router = express.Router();

const { authorize } = require('../middleware/auth');

const {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
} = require('../controllers/supplierController');

router.get('/', getSuppliers);

router.get('/:id', getSupplierById);

router.post(
    '/',
    authorize('admin', 'stock'),
    createSupplier
);

router.put(
    '/:id',
    authorize('admin', 'stock'),
    updateSupplier
);

router.delete(
    '/:id',
    authorize('admin'),
    deleteSupplier
);

module.exports = router;