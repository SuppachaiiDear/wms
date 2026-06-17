require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();


// Middleware
app.use(express.json());


// Public Folder
app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);


// Auth Middleware
const { verifyToken } = require('./middleware/auth');


// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const unitRoutes = require('./routes/units');
const productRoutes = require('./routes/products');
const stockReceiveRoutes = require('./routes/stockReceives');
const stockIssueRoutes = require('./routes/stockIssues');
const stockMovementRoutes = require('./routes/stockMovements');
const dashboardRoutes = require('./routes/dashboard');
const supplierRoutes = require('./routers/suppliers');

// Public Routes
app.use('/api/auth', authRoutes);


// Protected Routes
app.use('/api/users', verifyToken, userRoutes);

app.use(
    '/api/categories',
    verifyToken,
    categoryRoutes
);

app.use(
    '/api/units',
    verifyToken,
    unitRoutes
);

app.use(
    '/api/products',
    verifyToken,
    productRoutes
);

app.use(
    '/api/stock-receives',
    verifyToken,
    stockReceiveRoutes
);

app.use(
    '/api/stock-issues',
    verifyToken,
    stockIssueRoutes
);

app.use(
    '/api/stock-movements',
    verifyToken,
    stockMovementRoutes
);

app.use(
    '/api/suppliers',
    verifyToken,
    supplierRoutes
);

app.use(
    '/api/dashboard',
    verifyToken,
    dashboardRoutes
);


// Default Route
app.get('/', (req, res) => {
    res.json({
        message: 'WMS API Running'
    });
});


// Error Handler
app.use((err, req, res, next) => {

    console.log(err);

    res.status(500).json({
        success: false,
        message: 'Server Error'
    });
});


// Start Server
const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});