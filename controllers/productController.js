const db = require('../config/db');

const getProducts = async (req, res) => {
    try {
        const pool = await db;

        const result = await pool.request().query(`
            SELECT 
                p.*,
                c.name AS category_name,
                u.name AS unit_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE p.status = 1
            ORDER BY p.id DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const {
            code,
            barcode,
            name,
            category_id,
            unit_id,
            cost_price,
            sell_price,
            minimum_stock,
            description
        } = req.body;

        const pool = await db;

        await pool.request()
            .input('code', code)
            .input('barcode', barcode)
            .input('name', name)
            .input('category_id', category_id)
            .input('unit_id', unit_id)
            .input('cost_price', cost_price || 0)
            .input('sell_price', sell_price || 0)
            .input('minimum_stock', minimum_stock || 0)
            .input('description', description)
            .query(`
                INSERT INTO products (
                    code,
                    barcode,
                    name,
                    category_id,
                    unit_id,
                    cost_price,
                    sell_price,
                    minimum_stock,
                    description
                )
                VALUES (
                    @code,
                    @barcode,
                    @name,
                    @category_id,
                    @unit_id,
                    @cost_price,
                    @sell_price,
                    @minimum_stock,
                    @description
                )
            `);

        res.json({ message: 'Product created' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const pool = await db;
        const result = await pool.request()
            .input('id', req.params.id)
            .query(`
                SELECT *
                FROM products
                WHERE id = @id
                AND status = 1
            `);
    
        if (result.recordset.length === 0) {
            return res.status(404).json({
            message: 'Product not found'
            });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }

};

const updateProduct = async (req, res) => {
    try {
        const {
            code,
            barcode,
            name,
            category_id,
            unit_id,
            cost_price,
            sell_price,
            minimum_stock,
            description,
            status
        } = req.body;

        const pool = await db;

        await pool.request()
            .input('id', req.params.id)
            .input('code', code)
            .input('barcode', barcode)
            .input('name', name)
            .input('category_id', category_id)
            .input('unit_id', unit_id)
            .input('cost_price', cost_price || 0)
            .input('sell_price', sell_price || 0)
            .input('minimum_stock', minimum_stock || 0)
            .input('description', description)
            .input('status', status ?? 1)
            .query(`
                UPDATE products
                SET
                    code = @code,
                    barcode = @barcode,
                    name = @name,
                    category_id = @category_id,
                    unit_id = @unit_id,
                    cost_price = @cost_price,
                    sell_price = @sell_price,
                    minimum_stock = @minimum_stock,
                    description = @description,
                    status = @status
                WHERE id = @id
            `);

        res.json({
            message: 'Product updated'
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const pool = await db;

        await pool.request()
            .input('id', req.params.id)
            .query(`
                UPDATE products
                SET status = 0
                WHERE id = @id
            `);

        res.json({
            message: 'Product deleted'
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    getProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct
};