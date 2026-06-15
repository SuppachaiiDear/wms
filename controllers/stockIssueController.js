const sql = require('mssql');
const db = require('../config/db');


// GET ALL
const getIssues = async (req, res) => {

    try {

        const pool = await db;

        const result = await pool.request()
            .query(`
                SELECT *
                FROM stock_issues
                ORDER BY id DESC
            `);

        res.json(result.recordset);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });
    }
};


// CREATE ISSUE
const createIssue = async (req, res) => {

    const transaction =
        new sql.Transaction(await db);

    try {

        const {
            issue_no,
            farm_name,
            requester_name,
            remark,
            items
        } = req.body;

        await transaction.begin();

        // HEADER
        const headerRequest =
            new sql.Request(transaction);

        const issueResult =
            await headerRequest
                .input('issue_no', issue_no)
                .input('farm_name', farm_name)
                .input('requester_name', requester_name)
                .input('remark', remark)
                .input('created_by', req.user.id)
                .query(`
                    INSERT INTO stock_issues (
                        issue_no,
                        farm_name,
                        requester_name,
                        remark,
                        created_by
                    )
                    OUTPUT INSERTED.id
                    VALUES (
                        @issue_no,
                        @farm_name,
                        @requester_name,
                        @remark,
                        @created_by
                    )
                `);

        const issueId =
            issueResult.recordset[0].id;


        // DETAIL
        for (const item of items) {

            const total =
                item.qty * item.cost_price;


            // CHECK STOCK
            const stockRequest =
                new sql.Request(transaction);

            const stockResult =
                await stockRequest
                    .input(
                        'product_id',
                        item.product_id
                    )
                    .query(`
                        SELECT current_stock
                        FROM products
                        WHERE id = @product_id
                    `);

            const currentStock =
                stockResult.recordset[0]
                    .current_stock;

            if (currentStock < item.qty) {

                await transaction.rollback();

                return res.status(400).json({
                    message:
                        'Stock not enough'
                });
            }


            // INSERT DETAIL
            const detailRequest =
                new sql.Request(transaction);

            await detailRequest
                .input('issue_id', issueId)
                .input(
                    'product_id',
                    item.product_id
                )
                .input('qty', item.qty)
                .input(
                    'cost_price',
                    item.cost_price
                )
                .input('total', total)
                .query(`
                    INSERT INTO stock_issue_details (
                        issue_id,
                        product_id,
                        qty,
                        cost_price,
                        total
                    )
                    VALUES (
                        @issue_id,
                        @product_id,
                        @qty,
                        @cost_price,
                        @total
                    )
                `);


            // UPDATE STOCK
            const updateRequest =
                new sql.Request(transaction);

            await updateRequest
                .input(
                    'product_id',
                    item.product_id
                )
                .input('qty', item.qty)
                .query(`
                    UPDATE products
                    SET current_stock =
                        current_stock - @qty
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
                .input('movement_type', 'ISSUE')
                .input('ref_type', 'STOCK_ISSUE')
                .input('ref_id', issueId)
                .input('qty_in', 0)
                .input('qty_out', item.qty)
                .input('balance_qty', balanceQty)
                .input('remark', remark)
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
            message: 'Issue created'
        });

    } catch (err) {

        await transaction.rollback();

        res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    getIssues,
    createIssue
};