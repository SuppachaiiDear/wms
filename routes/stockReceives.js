const express = require('express');
const router = express.Router();

const { authorize } = require('../middleware/auth');

const {
    getStockReceives,
    createStockReceive
} = require('../controllers/stockReceiveController');

router.get('/', getStockReceives);

router.post(
    '/',
    authorize('admin', 'stock'),
    createStockReceive
);

module.exports = router;