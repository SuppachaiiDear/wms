const express = require('express');
const router = express.Router();

const { authorize } = require('../middleware/auth');

const {
    getStockReceives,
    getStockReceiveById,
    createStockReceive
} = require('../controllers/stockReceiveController');

router.get('/', getStockReceives);

router.get('/:id', getStockReceiveById);

router.post(
    '/',
    authorize('admin', 'stock'),
    createStockReceive
);

module.exports = router;