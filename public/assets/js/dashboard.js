const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

const loadDashboard = async () => {
    try {
        const res = await axios.get('/api/dashboard', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log(res.data);

        document.getElementById('totalProducts').innerText =
            res.data.total_products;

        document.getElementById('lowStock').innerText =
            res.data.low_stock;

        document.getElementById('totalReceive').innerText =
            res.data.total_receive;

        document.getElementById('totalIssue').innerText =
            res.data.total_issue;

    } catch (err) {
        console.log(err.response?.data);

        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
};

loadDashboard();