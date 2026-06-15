const db = require('../config/db');


// GET ALL
const getCategories = async (req, res) => {

    try {

        const pool = await db;

        const result = await pool.request()
            .query(`
                SELECT *
                FROM categories
                ORDER BY id DESC
            `);

        res.json(result.recordset);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });
    }
};


// CREATE
const createCategory = async (req, res) => {

    try {

        const {
            name,
            description
        } = req.body;

        const pool = await db;

        await pool.request()
            .input('name', name)
            .input('description', description)
            .query(`
                INSERT INTO categories (
                    name,
                    description
                )
                VALUES (
                    @name,
                    @description
                )
            `);

        res.json({
            message: 'Category created'
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });
    }
};


module.exports = {
    getCategories,
    createCategory
};