const db = require('../config/db');

const getDashboard = async (req, res) => {
    try {
        const pool = await db;

        const totalProducts = await pool.request().query(`
            SELECT COUNT(*) AS total_products
            FROM products
            WHERE status = 1
        `);

        const lowStock = await pool.request().query(`
            SELECT COUNT(*) AS low_stock
            FROM products
            WHERE current_stock <= minimum_stock
            AND status = 1
        `);

        const totalReceive = await pool.request().query(`
            SELECT COUNT(*) AS total_receive
            FROM stock_receives
        `);

        const totalIssue = await pool.request().query(`
            SELECT COUNT(*) AS total_issue
            FROM stock_issues
        `);

        const lowStockItems = await pool.request().query(`
            SELECT 
                p.id,
                p.code,
                p.name,
                p.current_stock,
                p.minimum_stock,
                u.name AS unit_name
            FROM products p
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE p.current_stock <= p.minimum_stock
            AND p.status = 1
            ORDER BY p.current_stock ASC
        `);

        res.json({
            total_products: totalProducts.recordset[0].total_products,
            low_stock: lowStock.recordset[0].low_stock,
            total_receive: totalReceive.recordset[0].total_receive,
            total_issue: totalIssue.recordset[0].total_issue,
            low_stock_items: lowStockItems.recordset
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    getDashboard
};