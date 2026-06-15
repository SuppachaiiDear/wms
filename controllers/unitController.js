const db = require('../config/db');

const getUnits = async (req, res) => {
    try {

        const pool = await db;

        const result = await pool.request().query(`
            SELECT *
            FROM units
            ORDER BY id DESC
        `);

        res.json(result.recordset);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });
    }
};

const createUnit = async (req, res) => {

    try {

        const { name, description } = req.body;

        const pool = await db;

        await pool.request()
            .input('name', name)
            .input('description', description)
            .query(`
                INSERT INTO units (
                    name,
                    description
                )
                VALUES (
                    @name,
                    @description
                )
            `);

        res.json({
            message: 'Unit created'
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    getUnits,
    createUnit
};