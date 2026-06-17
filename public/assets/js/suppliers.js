const token = localStorage.getItem('token');

let editSupplierId = null;
let suppliersDataTable = null;

if (!token) {
    window.location.href = 'login.html';
}

const authHeader = {
    headers: {
        Authorization: `Bearer ${token}`
    }
};

const loadSuppliers = async () => {
    try {
        const res = await axios.get('/api/suppliers', authHeader);

        if (suppliersDataTable) {
            suppliersDataTable.destroy();
            suppliersDataTable = null;
        }

        const tbody = document.getElementById('supplierTableBody');
        tbody.innerHTML = '';

        res.data.forEach(supplier => {
            tbody.innerHTML += `
                <tr>
                    <td>${supplier.code || ''}</td>
                    <td>${supplier.name || ''}</td>
                    <td>${supplier.contact_name || ''}</td>
                    <td>${supplier.phone || ''}</td>
                    <td>${supplier.email || ''}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editSupplier(${supplier.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSupplier(${supplier.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        suppliersDataTable = new simpleDatatables.DataTable('#suppliersTable', {
            searchable: true,
            fixedHeight: false,
            perPage: 10,
            perPageSelect: [10, 25, 50, 100],
            labels: {
                placeholder: 'ค้นหาผู้จำหน่าย...',
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

const saveSupplier = async () => {
    try {
        const payload = {
            code: document.getElementById('code').value,
            name: document.getElementById('name').value,
            contact_name: document.getElementById('contact_name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            remark: document.getElementById('remark').value
        };

        if (editSupplierId) {
            await axios.put(
                `/api/suppliers/${editSupplierId}`,
                payload,
                authHeader
            );

            alert('Supplier updated');
        } else {
            await axios.post(
                '/api/suppliers',
                payload,
                authHeader
            );

            alert('Supplier created');
        }

        clearSupplierForm();

        bootstrap.Modal.getInstance(
            document.getElementById('supplierModal')
        ).hide();

        loadSuppliers();

    } catch (err) {
        console.log(err.response?.data);
        alert(err.response?.data?.message || 'Save failed');
    }
};

const editSupplier = async (id) => {
    try {
        const res = await axios.get(
            `/api/suppliers/${id}`,
            authHeader
        );

        const supplier = res.data;

        editSupplierId = supplier.id;

        document.getElementById('code').value = supplier.code || '';
        document.getElementById('name').value = supplier.name || '';
        document.getElementById('contact_name').value = supplier.contact_name || '';
        document.getElementById('phone').value = supplier.phone || '';
        document.getElementById('email').value = supplier.email || '';
        document.getElementById('address').value = supplier.address || '';
        document.getElementById('remark').value = supplier.remark || '';

        document.getElementById('modalTitle').innerText = 'Edit Supplier';

        const modal = new bootstrap.Modal(
            document.getElementById('supplierModal')
        );

        modal.show();

    } catch (err) {
        console.log(err.response?.data);
        alert('Load supplier failed');
    }
};

const clearSupplierForm = () => {
    editSupplierId = null;

    document.getElementById('modalTitle').innerText = 'Add Supplier';

    document.getElementById('code').value = '';
    document.getElementById('name').value = '';
    document.getElementById('contact_name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('address').value = '';
    document.getElementById('remark').value = '';
};

const deleteSupplier = async (id) => {
    if (!confirm('Delete this supplier?')) {
        return;
    }

    try {
        await axios.delete(
            `/api/suppliers/${id}`,
            authHeader
        );

        alert('Supplier deleted');

        if (suppliersDataTable) {
            suppliersDataTable.destroy();
            suppliersDataTable = null;
        }

        await loadSuppliers();

    } catch (err) {
        console.log(err.response?.data);
        alert(err.response?.data?.message || 'Delete failed');
    }
};

loadSuppliers();