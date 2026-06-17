const sql = require('mssql');
const db = require('../config/db');

const getSuppliers = async (req, res) => {
    try {
        const pool = await db;

        const result = await pool.request().query(`
            SELECT *
            FROM suppliers
            WHERE status = 1
            ORDER BY id DESC
        `);

        res.json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

const getSupplierById = async (req, res) => {
    try {
        const pool = await db;

        const result = await pool
            .request()
            .input('id', req.params.id)
            .query(`
                SELECT *
                FROM suppliers
                WHERE id = @id
                AND status = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

const createSupplier = async (req, res) => {
    try {
        const pool = await db;

        const {
            code,
            name,
            contact_name,
            phone,
            email,
            address,
            remark
        } = req.body;

        if (!name) {
            return res.status(400).json({
                message: 'Supplier name is required'
            });
        }

        await pool
            .request()
            .input('code', code || '')
            .input('name', name)
            .input('contact_name', contact_name || '')
            .input('phone', phone || '')
            .input('email', email || '')
            .input('address', address || '')
            .input('remark', remark || '')
            .input('created_by', req.user.id)
            .query(`
                INSERT INTO suppliers (
                    code,
                    name,
                    contact_name,
                    phone,
                    email,
                    address,
                    remark,
                    created_by
                )
                VALUES (
                    @code,
                    @name,
                    @contact_name,
                    @phone,
                    @email,
                    @address,
                    @remark,
                    @created_by
                )
            `);

        res.json({
            message: 'Supplier created'
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const pool = await db;

        const {
            code,
            name,
            contact_name,
            phone,
            email,
            address,
            remark
        } = req.body;

        if (!name) {
            return res.status(400).json({
                message: 'Supplier name is required'
            });
        }

        const result = await pool
            .request()
            .input('id', req.params.id)
            .input('code', code || '')
            .input('name', name)
            .input('contact_name', contact_name || '')
            .input('phone', phone || '')
            .input('email', email || '')
            .input('address', address || '')
            .input('remark', remark || '')
            .query(`
                UPDATE suppliers
                SET
                    code = @code,
                    name = @name,
                    contact_name = @contact_name,
                    phone = @phone,
                    email = @email,
                    address = @address,
                    remark = @remark
                WHERE id = @id
                AND status = 1
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.json({
            message: 'Supplier updated'
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const pool = await db;

        const result = await pool
            .request()
            .input('id', req.params.id)
            .query(`
                UPDATE suppliers
                SET status = 0
                WHERE id = @id
                AND status = 1
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.json({
            message: 'Supplier deleted'
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
};