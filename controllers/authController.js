const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../config/db');

const login = async (req, res) => {

    const { username, password } = req.body;

    try {

        const pool = await db;

        const result = await pool.request()
            .input('username', username)
            .query(`
                SELECT 
                    users.*,
                    roles.name AS role_name
                FROM users
                LEFT JOIN roles
                ON users.role_id = roles.id
                WHERE username = @username
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                message: 'User not found'
            });
        }

        const user = result.recordset[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                message: 'Invalid password'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role_name
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role_name
            }
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: 'Server Error'
        });
    }
};

const register = async (req, res) => {

    res.json({
        message: 'register working'
    });
};

module.exports = {
    login,
    register
};