const express = require('express');
const router = express.Router();

const { authorize } = require('../middleware/auth');

const {
    getProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

router.get('/', getProducts);

router.post(
    '/',
    authorize('admin', 'stock'),
    createProduct
);

router.get('/:id', getProductById);

router.put(
    '/:id',
    authorize('admin', 'stock'),
    updateProduct
);

router.delete(
    '/:id',
    authorize('admin', 'stock'),
    deleteProduct
);

module.exports = router;