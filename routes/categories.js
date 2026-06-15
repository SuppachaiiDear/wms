const express = require('express');

const router = express.Router();

const {
    authorize
} = require('../middleware/auth');

const {
    getCategories,
    createCategory
} = require('../controllers/categoryController');


// GET ALL
router.get(
    '/',
    getCategories
);


// CREATE
router.post(
    '/',
    authorize('admin', 'stock'),
    createCategory
);

module.exports = router;