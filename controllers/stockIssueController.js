const sql = require('mssql');
const db = require('../config/db');

const getStockIssues = async (req, res) => {
    try {
        const pool = await db;

        const result = await pool.request().query(`
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

const getStockIssueById = async (req, res) => {
    try {
        const pool = await db;

        const headerResult = await pool
            .request()
            .input('id', req.params.id)
            .query(`
                SELECT
                    si.id,
                    si.issue_no,
                    si.issue_date,
                    si.farm_name,
                    si.requester_name,
                    si.remark,
                    si.created_by
                FROM stock_issues si
                WHERE si.id = @id
            `);

        if (headerResult.recordset.length === 0) {
            return res.status(404).json({
                message: 'Stock issue not found'
            });
        }

        const detailResult = await pool
            .request()
            .input('issue_id', req.params.id)
            .query(`
                SELECT
                    sid.id,
                    sid.product_id,
                    p.code AS product_code,
                    p.name AS product_name,
                    u.name AS unit_name,
                    sid.qty,
                    sid.cost_price,
                    sid.total
                FROM stock_issue_details sid
                INNER JOIN products p ON sid.product_id = p.id
                LEFT JOIN units u ON p.unit_id = u.id
                WHERE sid.issue_id = @issue_id
                ORDER BY sid.id ASC
            `);

        res.json({
            header: headerResult.recordset[0],
            details: detailResult.recordset
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

const createStockIssue = async (req, res) => {
    const pool = await db;
    const transaction = new sql.Transaction(pool);

    try {
        const {
            issue_no,
            farm_name,
            requester_name,
            remark,
            items
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'Items are required'
            });
        }

        await transaction.begin();

        const headerRequest = new sql.Request(transaction);

        const issueResult = await headerRequest
            .input('issue_no', issue_no)
            .input('farm_name', farm_name || '')
            .input('requester_name', requester_name || '')
            .input('remark', remark || '')
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

        const issueId = issueResult.recordset[0].id;

        for (const item of items) {
            const qty = Number(item.qty);
            const costPrice = Number(item.cost_price);
            const total = qty * costPrice;

            // Check sufficient stock
            const stockRequest = new sql.Request(transaction);

            const stockResult = await stockRequest
                .input('product_id', item.product_id)
                .query(`
                    SELECT current_stock
                    FROM products
                    WHERE id = @product_id
                `);

            const currentStock = stockResult.recordset[0]?.current_stock || 0;

            if (currentStock < qty) {
                await transaction.rollback();

                return res.status(400).json({
                    message: `Insufficient stock for product ID ${item.product_id}. Available: ${currentStock}`
                });
            }

            const detailRequest = new sql.Request(transaction);

            await detailRequest
                .input('issue_id', issueId)
                .input('product_id', item.product_id)
                .input('qty', qty)
                .input('cost_price', costPrice)
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

            const updateRequest = new sql.Request(transaction);

            await updateRequest
                .input('product_id', item.product_id)
                .input('qty', qty)
                .query(`
                    UPDATE products
                    SET current_stock = current_stock - @qty
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
                .input('qty_out', qty)
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
            message: 'Stock issue created'
        });

    } catch (err) {
        await transaction.rollback();

        res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    getStockIssues,
    getStockIssueById,
    createStockIssue
};