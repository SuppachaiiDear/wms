const sql = require('mssql');
const db = require('../config/db');

const getStockReceives = async (req, res) => {
    try {
        const pool = await db;

        const result = await pool.request().query(`
            SELECT *
            FROM stock_receives
            ORDER BY id DESC
        `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

const createStockReceive = async (req, res) => {
    const pool = await db;
    const transaction = new sql.Transaction(pool);

    try {
        const {
            receive_no,
            supplier_name,
            remark,
            items
        } = req.body;

        await transaction.begin();

        const headerRequest = new sql.Request(transaction);

        const receiveResult = await headerRequest
            .input('receive_no', receive_no)
            .input('supplier_name', supplier_name || '')
            .input('remark', remark || '')
            .input('created_by', req.user.id)
            .query(`
                INSERT INTO stock_receives (
                    receive_no,
                    supplier_name,
                    remark,
                    created_by
                )
                OUTPUT INSERTED.id
                VALUES (
                    @receive_no,
                    @supplier_name,
                    @remark,
                    @created_by
                )
            `);

        const receiveId = receiveResult.recordset[0].id;

        for (const item of items) {
            const qty = Number(item.qty);
            const costPrice = Number(item.cost_price);
            const total = qty * costPrice;

            const detailRequest = new sql.Request(transaction);

            await detailRequest
                .input('receive_id', receiveId)
                .input('product_id', item.product_id)
                .input('qty', qty)
                .input('cost_price', costPrice)
                .input('total', total)
                .query(`
                    INSERT INTO stock_receive_details (
                        receive_id,
                        product_id,
                        qty,
                        cost_price,
                        total
                    )
                    VALUES (
                        @receive_id,
                        @product_id,
                        @qty,
                        @cost_price,
                        @total
                    )
                `);

            const updateRequest = new sql.Request(transaction);

            await updateRequest
                .input('product_id', item.product_id)
                .input('qty', qty)
                .query(`
                    UPDATE products
                    SET current_stock = current_stock + @qty
                    WHERE id = @product_id
                `);

            const balanceRequest = new sql.Request(transaction);

            const balanceResult = await balanceRequest
                .input('product_id', item.product_id)
                .query(`
                    SELECT current_stock
                    FROM products
                    WHERE id = @product_id
                `);

            const balanceQty = balanceResult.recordset[0].current_stock;

            const movementRequest = new sql.Request(transaction);

            await movementRequest
                .input('product_id', item.product_id)
                .input('movement_type', 'RECEIVE')
                .input('ref_type', 'STOCK_RECEIVE')
                .input('ref_id', receiveId)
                .input('qty_in', qty)
                .input('qty_out', 0)
                .input('balance_qty', balanceQty)
                .input('remark', remark || '')
                .input('created_by', req.user.id)
                .query(`
                    INSERT INTO stock_movements (
                        product_id,
                        movement_type,
                        ref_type,
                        ref_id,
                        qty_in,
                        qty_out,
                        balance_qty,
                        remark,
                        created_by
                    )
                    VALUES (
                        @product_id,
                        @movement_type,
                        @ref_type,
                        @ref_id,
                        @qty_in,
                        @qty_out,
                        @balance_qty,
                        @remark,
                        @created_by
                    )
                `);
        }

        await transaction.commit();

        res.json({
            message: 'Stock receive created'
        });

    } catch (err) {
        await transaction.rollback();

        res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    getStockReceives,
    createStockReceive
};