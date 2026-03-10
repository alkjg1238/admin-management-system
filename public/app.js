// API Base URL
const API_URL = '';

// Current editing IDs
let editingAdminId = null;
let editingVacationId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAdmins();
    loadVacations();
});

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    // Reload data
    if (tabName === 'admins') loadAdmins();
    if (tabName === 'vacations') loadVacations();
}

// Modal functions
function openAdminModal(admin = null) {
    editingAdminId = admin ? admin.id : null;
    document.getElementById('admin-id').value = admin ? admin.id : '';
    document.getElementById('admin-name').value = admin ? admin.name : '';
    document.getElementById('admin-discord').value = admin ? admin.discord_id || '' : '';
    document.getElementById('admin-rank').value = admin ? admin.rank : 'Junior';
    document.getElementById('admin-notes').value = admin ? admin.notes || '' : '';
    document.getElementById('admin-promotion').value = admin ? admin.last_promotion || '' : '';
    
    document.getElementById('admin-modal').style.display = 'block';
}

function openVacationModal() {
    loadAdminSelect();
    document.getElementById('vacation-form').reset();
    document.getElementById('vacation-modal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Load admins
async function loadAdmins() {
    try {
        const response = await fetch(`${API_URL}/api/admins`);
        const admins = await response.json();
        
        const tbody = document.getElementById('admins-list');
        tbody.innerHTML = '';
        
        admins.forEach(admin => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${admin.name}</td>
                <td>${admin.rank}</td>
                <td>${admin.notes || '-'}</td>
                <td>${admin.last_promotion ? formatDate(admin.last_promotion) : '-'}</td>
                <td><span class="status status-${admin.status.toLowerCase()}">${admin.status}</span></td>
                <td>
                    <button class="btn btn-success" onclick='editAdmin(${JSON.stringify(admin)})'>تعديل</button>
                    <button class="btn btn-danger" onclick="deleteAdmin(${admin.id})">حذف</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error loading admins:', err);
    }
}

// Load admin select for vacation form
async function loadAdminSelect() {
    try {
        const response = await fetch(`${API_URL}/api/admins`);
        const admins = await response.json();
        
        const select = document.getElementById('vacation-admin');
        select.innerHTML = '<option value="">اختر الأداري</option>';
        
        admins.forEach(admin => {
            const option = document.createElement('option');
            option.value = admin.id;
            option.textContent = admin.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading admin select:', err);
    }
}

// Load vacations
async function loadVacations() {
    try {
        const response = await fetch(`${API_URL}/api/vacations`);
        const vacations = await response.json();
        
        const tbody = document.getElementById('vacations-list');
        tbody.innerHTML = '';
        
        vacations.forEach(vacation => {
            const row = document.createElement('tr');
            const statusClass = vacation.status.toLowerCase();
            const actionButtons = vacation.status === 'Pending' ? `
                <button class="btn btn-success" onclick="updateVacationStatus(${vacation.id}, 'Approved')">موافقة ✅</button>
                <button class="btn btn-danger" onclick="updateVacationStatus(${vacation.id}, 'Rejected')">رفض ❌</button>
            ` : '-';
            
            row.innerHTML = `
                <td>${vacation.admin_name}</td>
                <td>${formatDate(vacation.start_date)}</td>
                <td>${formatDate(vacation.end_date)}</td>
                <td>${vacation.reason}</td>
                <td><span class="status status-${statusClass}">${translateStatus(vacation.status)}</span></td>
                <td>${actionButtons}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error loading vacations:', err);
    }
}

// Save admin
async function saveAdmin(event) {
    event.preventDefault();
    
    const adminData = {
        name: document.getElementById('admin-name').value,
        discord_id: document.getElementById('admin-discord').value,
        rank: document.getElementById('admin-rank').value,
        notes: document.getElementById('admin-notes').value,
        last_promotion: document.getElementById('admin-promotion').value
    };
    
    try {
        const url = editingAdminId ? `${API_URL}/api/admins/${editingAdminId}` : `${API_URL}/api/admins`;
        const method = editingAdminId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminData)
        });
        
        if (response.ok) {
            closeModal('admin-modal');
            loadAdmins();
            alert(editingAdminId ? 'تم التحديث بنجاح!' : 'تم الإضافة بنجاح!');
        }
    } catch (err) {
        console.error('Error saving admin:', err);
        alert('حدث خطأ!');
    }
}

// Edit admin
function editAdmin(admin) {
    openAdminModal(admin);
}

// Delete admin
async function deleteAdmin(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/admins/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadAdmins();
            alert('تم الحذف بنجاح!');
        }
    } catch (err) {
        console.error('Error deleting admin:', err);
        alert('حدث خطأ!');
    }
}

// Save vacation
async function saveVacation(event) {
    event.preventDefault();
    
    const vacationData = {
        admin_id: document.getElementById('vacation-admin').value,
        start_date: document.getElementById('vacation-start').value,
        end_date: document.getElementById('vacation-end').value,
        reason: document.getElementById('vacation-reason').value
    };
    
    try {
        const response = await fetch(`${API_URL}/api/vacations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vacationData)
        });
        
        if (response.ok) {
            closeModal('vacation-modal');
            loadVacations();
            alert('تم إرسال الطلب بنجاح!');
        }
    } catch (err) {
        console.error('Error saving vacation:', err);
        alert('حدث خطأ!');
    }
}

// Update vacation status
async function updateVacationStatus(id, status) {
    const message = status === 'Approved' ? 'هل تريد الموافقة على الإجازة؟' : 'هل تريد رفض الإجازة؟';
    if (!confirm(message)) return;
    
    try {
        const response = await fetch(`${API_URL}/api/vacations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status, approved_by: 1 })
        });
        
        if (response.ok) {
            loadVacations();
            alert(status === 'Approved' ? 'تمت الموافقة على الإجازة! ✅' : 'تم رفض الإجازة! ❌');
        }
    } catch (err) {
        console.error('Error updating vacation:', err);
        alert('حدث خطأ!');
    }
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

function translateStatus(status) {
    const translations = {
        'Pending': 'قيد الانتظار',
        'Approved': 'مقبول ✅',
        'Rejected': 'مرفوض ❌',
        'Active': 'نشط',
        'Inactive': 'غير نشط'
    };
    return translations[status] || status;
}
