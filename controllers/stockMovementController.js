const db = require('../config/db');

const getMovements = async (req, res) => {
    try {
        const pool = await db;

        const result = await pool.request().query(`
            SELECT
                sm.*,
                p.code AS product_code,
                p.name AS product_name
            FROM stock_movements sm
            LEFT JOIN products p ON sm.product_id = p.id
            ORDER BY sm.id DESC
        `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    getMovements
};