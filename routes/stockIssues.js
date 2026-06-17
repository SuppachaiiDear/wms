const express = require('express');

const router = express.Router();

const { authorize } = require('../middleware/auth');

const {
    getStockIssues,
    getStockIssueById,
    createStockIssue
} = require('../controllers/stockIssueController');

router.get('/', getStockIssues);

router.get('/:id', getStockIssueById);

router.post(
    '/',
    authorize('admin', 'stock'),
    createStockIssue
);

module.exports = router;