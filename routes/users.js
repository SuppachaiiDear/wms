const express = require('express');

const router = express.Router();

const {
    verifyToken,
    authorize
} = require('../middleware/auth');

const {
    getUsers,
    createUser
} = require('../controllers/userController');


router.use(verifyToken);


router.get(
    '/',
    authorize('admin'),
    getUsers
);

router.post(
    '/',
    authorize('admin'),
    createUser
);

module.exports = router;