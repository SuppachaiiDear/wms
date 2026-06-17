const token = localStorage.getItem('token');

let issueDataTable = null;
let issueItems = [];
let productList = [];

if (!token) {
    window.location.href = 'login.html';
}

const authHeader = {
    headers: {
        Authorization: `Bearer ${token}`
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';

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

const loadIssues = async () => {
    try {
        const res = await axios.get('/api/stock-issues', authHeader);

        if (issueDataTable) {
            issueDataTable.destroy();
            issueDataTable = null;
        }

        const tbody = document.getElementById('issueTableBody');
        tbody.innerHTML = '';

        res.data.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.issue_no || ''}</td>
                    <td>${formatDate(item.issue_date)}</td>
                    <td>${item.farm_name || ''}</td>
                    <td>${item.requester_name || ''}</td>
                    <td>${item.remark || ''}</td>
                    <td>
                        <a href="stock-issue-detail.html?id=${item.id}" class="btn btn-info btn-sm">
                            <i class="fas fa-eye"></i>
                        </a>
                    </td>
                </tr>
            `;
        });

        issueDataTable = new simpleDatatables.DataTable('#issueTable', {
            searchable: true,
            fixedHeight: false,
            perPage: 10,
            perPageSelect: [10, 25, 50, 100],
            labels: {
                placeholder: 'ค้นหาใบเบิกสินค้า...',
                perPage: 'รายการต่อหน้า',
                noRows: 'ไม่พบข้อมูล',
                info: 'แสดง {start} ถึง {end} จาก {rows} รายการ'
            }
        });

    } catch (err) {
        console.log(err.response?.data);

        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
};

const loadProducts = async () => {
    try {
        const res = await axios.get('/api/products', authHeader);

        productList = res.data;

        const productSelect = document.getElementById('product_id');
        productSelect.innerHTML = '<option value="">Select Product</option>';

        res.data.forEach(product => {
            productSelect.innerHTML += `
                <option value="${product.id}">
                    ${product.code || ''} - ${product.name}
                </option>
            `;
        });

    } catch (err) {
        console.log(err.response?.data);
    }
};

// Auto-fill cost price and show available stock when product selected
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('product_id').addEventListener('change', function () {
        const productId = this.value;
        const product = productList.find(p => p.id == productId);

        if (product) {
            document.getElementById('cost_price').value = product.cost_price || 0;
            document.getElementById('available_stock').value = product.current_stock || 0;
        } else {
            document.getElementById('cost_price').value = '';
            document.getElementById('available_stock').value = '';
        }
    });
});

const updateModalTotal = () => {
    const grandTotal = issueItems.reduce((sum, item) => sum + item.total, 0);
    document.getElementById('modal_grand_total').innerText = formatNumber(grandTotal);
};

const addIssueItem = () => {
    const productId = document.getElementById('product_id').value;
    const qty = Number(document.getElementById('qty').value);
    const costPrice = Number(document.getElementById('cost_price').value);

    if (!productId || qty <= 0) {
        alert('Please select product and enter qty');
        return;
    }

    const product = productList.find(p => p.id == productId);
    const availableStock = Number(product.current_stock || 0);

    if (qty > availableStock) {
        alert(`Insufficient stock. Available: ${availableStock}`);
        return;
    }

    // Check duplicate product
    const existing = issueItems.findIndex(i => i.product_id == productId);

    if (existing >= 0) {
        alert('Product already added. Remove it first to change qty.');
        return;
    }

    issueItems.push({
        product_id: Number(productId),
        product_name: product.name,
        qty,
        cost_price: costPrice,
        total: qty * costPrice
    });

    renderIssueItems();

    document.getElementById('product_id').value = '';
    document.getElementById('qty').value = '';
    document.getElementById('cost_price').value = '';
    document.getElementById('available_stock').value = '';
};

const renderIssueItems = () => {
    const tbody = document.getElementById('issueItemsTable');
    tbody.innerHTML = '';

    if (issueItems.length === 0) {
        tbody.innerHTML = `
            <tr id="emptyRow">
                <td colspan="5" class="text-center text-muted">No items added</td>
            </tr>
        `;
        updateModalTotal();
        return;
    }

    issueItems.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${item.product_name}</td>
                <td class="text-end">${item.qty}</td>
                <td class="text-end">${formatNumber(item.cost_price)}</td>
                <td class="text-end">${formatNumber(item.total)}</td>
                <td class="text-center">
                    <button class="btn btn-danger btn-sm" onclick="removeIssueItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    updateModalTotal();
};

const removeIssueItem = (index) => {
    issueItems.splice(index, 1);
    renderIssueItems();
};

const saveIssue = async () => {
    if (issueItems.length === 0) {
        alert('Please add at least one item');
        return;
    }

    const issueNo = document.getElementById('issue_no').value;

    if (!issueNo) {
        alert('Please enter Issue No.');
        return;
    }

    try {
        const payload = {
            issue_no: issueNo,
            farm_name: document.getElementById('farm_name').value,
            requester_name: document.getElementById('requester_name').value,
            remark: document.getElementById('remark').value,
            items: issueItems
        };

        await axios.post('/api/stock-issues', payload, authHeader);

        alert('Stock issue created');

        clearIssueForm();

        bootstrap.Modal.getInstance(
            document.getElementById('issueModal')
        ).hide();

        await loadIssues();

    } catch (err) {
        console.log(err.response?.data);
        alert(err.response?.data?.message || 'Save issue failed');
    }
};

const clearIssueForm = () => {
    issueItems = [];

    document.getElementById('issue_no').value =
        'IS' + new Date().getTime();

    document.getElementById('farm_name').value = '';
    document.getElementById('requester_name').value = '';
    document.getElementById('remark').value = '';
    document.getElementById('product_id').value = '';
    document.getElementById('qty').value = '';
    document.getElementById('cost_price').value = '';
    document.getElementById('available_stock').value = '';

    renderIssueItems();
};

loadIssues();
loadProducts();