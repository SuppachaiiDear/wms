const express = require('express');

const router = express.Router();

const { authorize } =
    require('../middleware/auth');

const {
    getIssues,
    createIssue
} = require(
    '../controllers/stockIssueController'
);


router.get(
    '/',
    getIssues
);


router.post(
    '/',
    authorize('admin', 'stock'),
    createIssue
);

module.exports = router;