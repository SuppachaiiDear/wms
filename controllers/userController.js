const bcrypt = require('bcryptjs');

const db = require('../config/db');

const getUsers = async (req, res) => {

    try {

        const pool = await db;

        const result = await pool.request().query(`
            SELECT
                users.id,
                users.username,
                users.fullname,
                users.status,
                roles.name AS role
            FROM users
            LEFT JOIN roles
            ON users.role_id = roles.id
        `);

        res.json(result.recordset);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });
    }
};

const createUser = async (req, res) => {

    try {

        const {
            username,
            password,
            fullname,
            role_id
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const pool = await db;

        await pool.request()
            .input('username', username)
            .input('password', hashedPassword)
            .input('fullname', fullname)
            .input('role_id', role_id)
            .query(`
                INSERT INTO users (
                    username,
                    password,
                    fullname,
                    role_id
                )
                VALUES (
                    @username,
                    @password,
                    @fullname,
                    @role_id
                )
            `);

        res.json({
            message: 'User created'
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    getUsers,
    createUser
};