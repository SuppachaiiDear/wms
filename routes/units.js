const express = require('express');
const router = express.Router();

const { authorize } = require('../middleware/auth');

const {
    getUnits,
    createUnit
} = require('../controllers/unitController');

router.get('/', getUnits);

router.post(
    '/',
    authorize('admin', 'stock'),
    createUnit
);

module.exports = router;