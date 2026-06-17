const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

const authHeader = {
    headers: {
        Authorization: `Bearer ${token}`
    }
};

const getReceiveId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
};

const formatDate = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);

    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const loadDetail = async () => {
    const id = getReceiveId();

    if (!id) {
        alert('Invalid receive ID');
        window.location.href = 'stock-receives.html';
        return;
    }

    try {
        const res = await axios.get(
            `/api/stock-receives/${id}`,
            authHeader
        );

        const { header, details } = res.data;

        // Render header
        document.getElementById('receive_no').innerText =
            header.receive_no || '-';

        document.getElementById('receive_date').innerText =
            formatDate(header.receive_date);

        document.getElementById('supplier_name').innerText =
            header.supplier_name || '-';

        document.getElementById('created_by').innerText =
            header.created_by || '-';

        document.getElementById('remark').innerText =
            header.remark || '-';

        // Render detail rows
        const tbody = document.getElementById('detailTableBody');
        tbody.innerHTML = '';

        let totalQty = 0;
        let grandTotal = 0;

        if (details.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">ไม่พบรายการ</td>
                </tr>
            `;
        } else {
            details.forEach((item, index) => {
                totalQty += Number(item.qty || 0);
                grandTotal += Number(item.total || 0);

                tbody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.product_code || ''}</td>
                        <td>${item.product_name || ''}</td>
                        <td>${item.unit_name || ''}</td>
                        <td class="text-end">${Number(item.qty || 0).toLocaleString('th-TH')}</td>
                        <td class="text-end">${formatNumber(item.cost_price)}</td>
                        <td class="text-end">${formatNumber(item.total)}</td>
                    </tr>
                `;
            });
        }

        document.getElementById('total_qty').innerText =
            totalQty.toLocaleString('th-TH');

        document.getElementById('grand_total').innerText =
            formatNumber(grandTotal);

    } catch (err) {
        console.log(err.response?.data);

        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        if (err.response?.status === 404) {
            alert('Receive not found');
            window.location.href = 'stock-receives.html';
            return;
        }

        alert(err.response?.data?.message || 'Load failed');
    }
};

loadDetail();