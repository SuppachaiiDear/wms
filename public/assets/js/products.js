const token = localStorage.getItem('token');

let editProductId = null;

let productsDataTable = null;

if (!token) {
    window.location.href = 'login.html';
}

const authHeader = {
    headers: {
        Authorization: `Bearer ${token}`
    }
};

const loadProducts = async () => {
    try {
        const res = await axios.get('/api/products', authHeader);

        if (productsDataTable) {
            productsDataTable.destroy();
            productsDataTable = null;
        }

        const tbody = document.getElementById('productTable');
        tbody.innerHTML = '';

        res.data.forEach(product => {
            tbody.innerHTML += `
                <tr>
                    <td>${product.code || ''}</td>
                    <td>${product.name || ''}</td>
                    <td>${product.category_name || ''}</td>
                    <td>${product.unit_name || ''}</td>
                    <td>${product.current_stock || 0}</td>
                    <td>${product.cost_price || 0}</td>
                    <td>${product.sell_price || 0}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i>
                        </button>

                        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        productsDataTable = new simpleDatatables.DataTable("#productsTable", {
            searchable: true,
            fixedHeight: false,
            perPage: 10,
            perPageSelect: [10, 25, 50, 100],
            labels: {
                placeholder: "ค้นหาสินค้า...",
                perPage: "รายการต่อหน้า",
                noRows: "ไม่พบข้อมูล",
                info: "แสดง {start} ถึง {end} จาก {rows} รายการ"
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

const saveProduct = async () => {
    try {
        const payload = {
            code: document.getElementById('code').value,
            name: document.getElementById('name').value,
            category_id: document.getElementById('category_id').value,
            unit_id: document.getElementById('unit_id').value,
            cost_price: document.getElementById('cost_price').value || 0,
            sell_price: document.getElementById('sell_price').value || 0,
            minimum_stock: document.getElementById('minimum_stock').value || 0
        };

        if (editProductId) {
            await axios.put(
                `/api/products/${editProductId}`,
                payload,
                authHeader
            );

            alert('Product updated');
        } else {
            await axios.post(
                '/api/products',
                payload,
                authHeader
            );

            alert('Product created');
        }

        clearProductForm();

        const modal = bootstrap.Modal.getInstance(
            document.getElementById('productModal')
        );

        modal.hide();

        loadProducts();

    } catch (err) {
        console.log(err.response?.data);
        alert(err.response?.data?.message || 'Save failed');
    }
};

const editProduct = async (id) => {
    try {
        const res = await axios.get(
            `/api/products/${id}`,
            authHeader
        );

        const product = res.data;

        editProductId = product.id;

        document.getElementById('code').value = product.code || '';
        document.getElementById('name').value = product.name || '';
        document.getElementById('category_id').value = product.category_id || '';
        document.getElementById('unit_id').value = product.unit_id || '';
        document.getElementById('cost_price').value = product.cost_price || '';
        document.getElementById('sell_price').value = product.sell_price || '';
        document.getElementById('minimum_stock').value = product.minimum_stock || '';

        document.getElementById('modalTitle').innerText = 'Edit Product';

        const modal = new bootstrap.Modal(
            document.getElementById('productModal')
        );

        modal.show();

    } catch (err) {
        console.log(err.response?.data);
        alert('Load product failed');
    }
};

const clearProductForm = () => {
    editProductId = null;

    document.getElementById('modalTitle').innerText = 'Add Product';

    document.getElementById('code').value = '';
    document.getElementById('name').value = '';
    document.getElementById('category_id').value = '';
    document.getElementById('unit_id').value = '';
    document.getElementById('cost_price').value = '';
    document.getElementById('sell_price').value = '';
    document.getElementById('minimum_stock').value = '';
};

const loadCategories = async () => {
    const res = await axios.get('/api/categories', authHeader);

    const category = document.getElementById('category_id');

    category.innerHTML = `
        <option value="">Select Category</option>
    `;

    res.data.forEach(item => {
        category.innerHTML += `
            <option value="${item.id}">
                ${item.name}
            </option>
        `;
    });
};

const loadUnits = async () => {
    const res = await axios.get('/api/units', authHeader);

    const unit = document.getElementById('unit_id');

    unit.innerHTML = `
        <option value="">Select Unit</option>
    `;

    res.data.forEach(item => {
        unit.innerHTML += `
            <option value="${item.id}">
                ${item.name}
            </option>
        `;
    });
};

const deleteProduct = async (id) => {

    if (!confirm('Delete this product?')) {
        return;
    }

    try {
        await axios.delete(
            `/api/products/${id}`,
            authHeader
        );

        alert('Product deleted');

        if (productsDataTable) {
            productsDataTable.destroy();
            productsDataTable = null;
        }

        await loadProducts();

    } catch (err) {
        console.log(err.response?.data);

        alert(
            err.response?.data?.message ||
            'Delete failed'
        );
    }
};

loadProducts();
loadCategories();
loadUnits();