const sql = require('mssql');

const config = {
    user: 'sa',
    password: '888_qazwsx',
    server: '192.168.101.201',
    database: 'wms',
    options: {
        trustServerCertificate: true
    }
};

module.exports = sql.connect(config);