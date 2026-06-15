const token = localStorage.getItem('token');

let receiveDataTable = null;
let receiveItems = [];
let productList = [];

if (!token) {
    window.location.href = 'login.html';
}

const authHeader = {
    headers: {
        Authorization: `Bearer ${token}`
    }
};

const loadReceives = async () => {
    try {
        const res = await axios.get('/api/stock-receives', authHeader);

        if (receiveDataTable) {
            receiveDataTable.destroy();
            receiveDataTable = null;
        }

        const tbody = document.getElementById('receiveTableBody');
        tbody.innerHTML = '';

        res.data.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.receive_no || ''}</td>
                    <td>${formatDate(item.receive_date)}</td>
                    <td>${item.supplier_name || ''}</td>
                    <td>${item.remark || ''}</td>
                    <td>${item.created_by || ''}</td>
                </tr>
            `;
        });

        receiveDataTable = new simpleDatatables.DataTable('#receiveTable', {
            searchable: true,
            fixedHeight: false,
            perPage: 10,
            perPageSelect: [10, 25, 50, 100],
            labels: {
                placeholder: 'ค้นหาใบรับสินค้า...',
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

const addReceiveItem = () => {
    const productId = document.getElementById('product_id').value;
    const qty = Number(document.getElementById('qty').value);
    const costPrice = Number(document.getElementById('cost_price').value);

    if (!productId || qty <= 0 || costPrice < 0) {
        alert('Please select product, qty and cost price');
        return;
    }

    const product = productList.find(p => p.id == productId);

    receiveItems.push({
        product_id: Number(productId),
        product_name: product.name,
        qty,
        cost_price: costPrice,
        total: qty * costPrice
    });

    renderReceiveItems();

    document.getElementById('product_id').value = '';
    document.getElementById('qty').value = '';
    document.getElementById('cost_price').value = '';
};

const renderReceiveItems = () => {
    const tbody = document.getElementById('receiveItemsTable');
    tbody.innerHTML = '';

    receiveItems.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${item.product_name}</td>
                <td>${item.qty}</td>
                <td>${item.cost_price}</td>
                <td>${item.total}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="removeReceiveItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
};

const removeReceiveItem = (index) => {
    receiveItems.splice(index, 1);
    renderReceiveItems();
};

const saveReceive = async () => {
    if (receiveItems.length === 0) {
        alert('Please add at least one item');
        return;
    }

    try {
        const payload = {
            receive_no: document.getElementById('receive_no').value,
            supplier_name: document.getElementById('supplier_name').value,
            remark: document.getElementById('remark').value,
            items: receiveItems
        };

        await axios.post('/api/stock-receives', payload, authHeader);

        alert('Stock receive created');

        clearReceiveForm();

        bootstrap.Modal.getInstance(
            document.getElementById('receiveModal')
        ).hide();

        await loadReceives();

    } catch (err) {
        console.log(err.response?.data);
        alert(err.response?.data?.message || 'Save receive failed');
    }
};

const clearReceiveForm = () => {
    receiveItems = [];

    document.getElementById('receive_no').value =
        'RC' + new Date().getTime();

    document.getElementById('supplier_name').value = '';
    document.getElementById('remark').value = '';
    document.getElementById('product_id').value = '';
    document.getElementById('qty').value = '';
    document.getElementById('cost_price').value = '';

    renderReceiveItems();
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

loadReceives();
loadProducts();