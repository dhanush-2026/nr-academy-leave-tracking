const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];

const api = async (url, opt = {}) => {
    const r = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(opt.headers || {})
        },
        ...opt
    });

    if (r.status === 401 || r.status === 403) {
        location.href = '/';
        throw new Error('Session expired or access denied');
    }

    let d = null;

    try {
        d = await r.json();
    } catch {}

    if (!r.ok) throw new Error(d?.error || 'Request failed');

    return d;
};

const today = () => new Date().toISOString().slice(0, 10),
    fmt = d => d
        ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
        : '-';

const toast = (msg, type = 'success') => {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    $('#toastHost').appendChild(el);
    setTimeout(() => el.remove(), 2800);
};

let employees = [],
    attendance = [];

function showPage(name) {
    $$('.page').forEach(p => p.classList.add('hidden'));
    $('#page-' + name)?.classList.remove('hidden');

    $$('.nav-item[data-page]').forEach(b =>
        b.classList.toggle('active', b.dataset.page === name)
    );

    $('#sidebar').classList.remove('open');

    if (name === 'dashboard') loadDashboard();
    if (name === 'employees') loadEmployees();
    if (name === 'attendance') loadAttendance();
    if (name === 'leaveTracking') loadLeaveTracking();
    if (name === 'leaveRequests') loadRequests();
    if (name === 'holidays') loadHolidays();
    if (name === 'users') loadUsers();
    if (name === 'reports') runReport();
}

$$('[data-page]').forEach(b =>
    b.onclick = () => showPage(b.dataset.page)
);

$$('[data-page-link]').forEach(b =>
    b.onclick = () => showPage(b.dataset.pageLink)
);

$('#mobileMenu').onclick = () => $('#sidebar').classList.toggle('open');

async function init() {
    try {
        const me = await api('/api/auth/me');

        if (me.role !== 'ADMIN') {
            location.href = '/user.html';
            return;
        }

        $('#topUsername').textContent = me.username;

        $('#todayLabel').textContent = new Date().toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        $('#attendanceDate').value = today();

        let f = new Date();
        f.setDate(1);

        $('#leaveFrom').value = f.toISOString().slice(0, 10);
        $('#leaveTo').value = today();

        $('#requestFrom').value = f.toISOString().slice(0, 10);
        $('#requestTo').value = today();

        $('#reportFrom').value = f.toISOString().slice(0, 10);
        $('#reportTo').value = today();

        await loadEmployees(true);
        await loadDashboard();
        await loadHolidays();
        await loadRequests();
    } catch (e) {
        if (!location.pathname.endsWith('index.html')) {
            location.href = '/';
        }
    }
}

async function loadEmployees(silent = false) {
    try {
        employees = await api('/api/admin/employees');
        renderEmployeeOptions();
        renderEmployees(employees);

        if (!silent) toast('Employee list refreshed');
    } catch (e) {
        toast(e.message, 'error');
    }
}

function renderEmployeeOptions() {
    const deps = [...new Set(
        employees.map(e => e.department).filter(Boolean)
    )].sort();

    ['employeeDept', 'dashDept'].forEach(id => {
        const el = $('#' + id);
        if (!el) return;

        const val = el.value;

        el.innerHTML = '<option value="">All Departments</option>' +
            deps.map(d => `<option>${esc(d)}</option>`).join('');

        el.value = val;
    });
}

function filteredEmployees(search = '', dept = '') {
    return employees.filter(e =>
        (!search ||
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.employeeId.toLowerCase().includes(search.toLowerCase())) &&
        (!dept || e.department === dept)
    );
}

function renderEmployees(list) {
    $('#employeeTable').innerHTML =
        list.map(e => employeeRow(e)).join('') ||
        emptyRow(10, 'No employees found');

    $('#dashEmployeeTable').innerHTML =
        list.slice(0, 12).map(e => dashEmployeeRow(e)).join('') ||
        emptyRow(8, 'No employees found');

    bindEmployeeActions();
}

function employeeRow(e) {
    return `<tr>
        <td><b>${esc(e.employeeId)}</b></td>
        <td>${esc(e.name)}</td>
        <td>${esc(e.department || '-')}</td>
        <td>${esc(e.email || '-')}</td>
        <td>${esc(e.phone || '-')}</td>
        <td>${fmt(e.dateOfBirth)}</td>
        <td>${fmt(e.dateOfJoining)}</td>
        <td>${esc(e.bloodGroup || '-')}</td>
        <td>
            <span class="status ${e.active ? 'ACTIVE' : 'INACTIVE'}">
                ${e.active ? 'Active' : 'Inactive'}
            </span>
        </td>
        <td>
            <div class="row-actions">
                <button data-action="edit" data-id="${e.id}" title="Edit">✎</button>
                <button data-action="view" data-id="${e.id}" title="View">◉</button>
                <button class="delete" data-action="delete" data-id="${e.id}" title="Delete">♲</button>
            </div>
        </td>
    </tr>`;
}

function dashEmployeeRow(e) {
    return `<tr>
        <td>${esc(e.employeeId)}</td>
        <td>${esc(e.name)}</td>
        <td>${esc(e.department || '-')}</td>
        <td>${esc(e.email || '-')}</td>
        <td>${esc(e.phone || '-')}</td>
        <td>${fmt(e.dateOfJoining)}</td>
        <td>
            <span class="status ${e.active ? 'ACTIVE' : 'INACTIVE'}">
                ${e.active ? 'Active' : 'Inactive'}
            </span>
        </td>
        <td>
            <div class="row-actions">
                <button data-action="edit" data-id="${e.id}">✎</button>
                <button class="delete" data-action="delete" data-id="${e.id}">♲</button>
            </div>
        </td>
    </tr>`;
}

function bindEmployeeActions() {
    $$('[data-action]').forEach(b => {
        b.onclick = () => {
            const e = employees.find(x => x.id == b.dataset.id);
            if (!e) return;

            if (b.dataset.action === 'edit') openEmployee(e);
            else if (b.dataset.action === 'view') openEmployee(e, true);
            else if (b.dataset.action === 'delete') deleteEmployee(e);
        };
    });
}

function openEmployee(e = null, view = false) {
    openModal(`
        <div class="modal-head">
            <h2>${view ? 'Employee Details' : e ? 'Edit Employee' : 'Add Employee'}</h2>
            <button class="close" id="closeModal">×</button>
        </div>
        <div class="modal-body">
            <form id="employeeForm">
                <div class="form-grid">
                    <label>Employee ID
                        <input name="employeeId" required value="${esc(e?.employeeId || '')}" ${view ? 'disabled' : ''}>
                    </label>
                    <label>Name
                        <input name="name" required value="${esc(e?.name || '')}" ${view ? 'disabled' : ''}>
                    </label>
                    <label>Department
                        <input name="department" value="${esc(e?.department || '')}" ${view ? 'disabled' : ''}>
                    </label>
                    <label>Email
                        <input name="email" type="email" value="${esc(e?.email || '')}" ${view ? 'disabled' : ''}>
                    </label>
                    <label>Phone
                        <input name="phone" value="${esc(e?.phone || '')}" ${view ? 'disabled' : ''}>
                    </label>
                    <label>Additional Phone
                        <input name="additionalPhone" value="${esc(e?.additionalPhone || '')}" ${view ? 'disabled' : ''}>
                    </label>
                    <label>Date of Birth
                        <input name="dateOfBirth" type="date" value="${e?.dateOfBirth || ''}" ${view ? 'disabled' : ''}>
                    </label>
                    <label>Date of Joining
                        <input name="dateOfJoining" type="date" value="${e?.dateOfJoining || ''}" ${view ? 'disabled' : ''}>
                    </label>
                    <label>Blood Group
                        <input name="bloodGroup" value="${esc(e?.bloodGroup || '')}" ${view ? 'disabled' : ''}>
                    </label>
                    <label class="full-field">Address
                        <textarea name="address" ${view ? 'disabled' : ''}>${esc(e?.address || '')}</textarea>
                    </label>
                </div>
                ${view ? '' : `
                    <div class="modal-actions">
                        <button type="button" class="btn light" id="closeModal2">Cancel</button>
                        <button class="btn primary">Save Employee</button>
                    </div>
                `}
            </form>
        </div>
    `);

    $('#closeModal').onclick = closeModal;
    $('#closeModal2')?.addEventListener('click', closeModal);

    if (!view) {
        $('#employeeForm').onsubmit = async ev => {
            ev.preventDefault();

            const data = Object.fromEntries(new FormData(ev.target));
            data.active = true;

            try {
                await api(
                    e ? `/api/admin/employees/${e.id}` : '/api/admin/employees',
                    {
                        method: e ? 'PUT' : 'POST',
                        body: JSON.stringify(data)
                    }
                );

                closeModal();
                await loadEmployees(true);
                await loadDashboard();

                toast(e ? 'Employee updated' : 'Employee added');
            } catch (err) {
                toast(err.message, 'error');
            }
        };
    }
}

async function deleteEmployee(e) {
    if (!confirm(`Delete ${e.name}? This deactivates the employee.`)) return;

    try {
        await api('/api/admin/employees/' + e.id, {
            method: 'DELETE'
        });

        await loadEmployees(true);
        await loadDashboard();

        toast('Employee deleted');
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function loadDashboard() {
    try {
        const d = await api('/api/admin/dashboard');

        $('#mEmployees').textContent = d.totalEmployees;
        $('#mPresent').textContent = d.todayPresent;
        $('#mAbsent').textContent = d.todayAbsent;
        $('#mLeave').textContent = d.currentMonthLeaveDays;

        const total = d.todayPresent + d.todayAbsent;

        $('#mPresentPct').textContent = total
            ? Math.round(d.todayPresent / total * 100) + '% attendance'
            : '0% attendance';

        $('#donutTotal').textContent = total;
        $('#legendPresent').textContent = d.todayPresent;
        $('#legendAbsent').textContent = d.todayAbsent;

        const pct = total ? d.todayPresent / total * 360 : 360;

        $('#attendanceDonut').style.background =
            `conic-gradient(var(--blue) 0deg ${pct}deg,var(--red) ${pct}deg 360deg)`;

        renderBars('#leaveChart', d.leaveTrend);

        $('#pendingBadge').textContent = d.pendingRequests || '';
        $('#bellBadge').textContent = d.pendingRequests || '0';

        renderRecent(d);

        if (!employees.length) {
            await loadEmployees(true);
        } else {
            renderEmployees(
                filteredEmployees(
                    $('#dashEmployeeSearch')?.value || '',
                    $('#dashDept')?.value || ''
                )
            );
        }
    } catch (e) {
        toast(e.message, 'error');
    }
}

function renderBars(sel, data) {
    const max = Math.max(1, ...data.map(x => x.days));

    $(sel).innerHTML = data.map(x => `
        <div class="bar-col">
            <span class="bar-value">${x.days}</span>
            <div class="bar" style="height:${Math.max(3, x.days / max * 145)}px"></div>
            <span class="bar-label">${x.month.slice(5)}</span>
        </div>
    `).join('');
}

function renderRecent(d) {
    api(
        '/api/admin/leaves?from=' +
        encodeURIComponent(
            new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10)
        ) +
        '&to=' + today()
    ).then(rows => {
        $('#recentRequests').innerHTML = rows.slice(0, 4).map(l => `
            <div class="mini-item">
                <div class="avatar">${esc(l.employeeName[0])}</div>
                <div class="mini-main">
                    <b>${esc(l.employeeName)}</b>
                    <small>${fmt(l.fromDate)} - ${fmt(l.toDate)} · ${l.leaveDays} days</small>
                </div>
                <span class="status ${l.status}">${l.status}</span>
            </div>
        `).join('') || '<div class="mini-item">No recent requests</div>';
    }).catch(() => {});

    $('#upcomingHolidays').innerHTML = (d.upcomingHolidays || []).map(h => `
        <div class="mini-item">
            <div class="action-icon">▣</div>
            <div class="mini-main">
                <b>${fmt(h.date)}</b>
                <small>${esc(h.name)}</small>
            </div>
        </div>
    `).join('') || '<div class="mini-item">No upcoming holidays</div>';
}

async function loadAttendance() {
    const date = $('#attendanceDate').value || today();

    $('#attendanceSelected').textContent = fmt(date);

    try {
        attendance = await api('/api/admin/attendance?date=' + date);
        renderAttendance();
    } catch (e) {
        toast(e.message, 'error');
    }
}

function renderAttendance() {
    $('#attendanceTable').innerHTML = attendance.map(a => `
        <tr>
            <td>${esc(a.employeeCode)}</td>
            <td>${esc(a.name)}</td>
            <td><span class="status ${a.status}">${a.status}</span></td>
            <td>
                <div class="attendance-status">
                    <button class="present-btn" data-att="PRESENT" data-id="${a.employeeId}">Present</button>
                    <button class="absent-btn" data-att="ABSENT" data-id="${a.employeeId}">Absent</button>
                </div>
            </td>
        </tr>
    `).join('');

    $$('[data-att]').forEach(b => {
        b.onclick = () => {
            const a = attendance.find(x => x.employeeId == b.dataset.id);
            a.status = b.dataset.att;
            renderAttendance();
        };
    });
}

async function saveAttendance() {
    try {
        await api('/api/admin/attendance?date=' + $('#attendanceDate').value, {
            method: 'PUT',
            body: JSON.stringify(
                attendance.map(a => ({
                    employeeId: a.employeeId,
                    status: a.status
                }))
            )
        });

        await loadDashboard();
        toast('Attendance saved');
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function loadLeaveTracking() {
    const p = $('#leavePreset').value;
    const now = new Date();

    let from, to;

    if (p === 'month') {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
    } else if (p === '3months') {
        from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        to = now;
    } else if (p === 'year') {
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        to = now;
    } else {
        from = new Date($('#leaveFrom').value + 'T00:00:00');
        to = new Date($('#leaveTo').value + 'T00:00:00');
    }

    $('#leaveFrom').value = from.toISOString().slice(0, 10);
    $('#leaveTo').value = to.toISOString().slice(0, 10);

    try {
        const rows = await api(
            `/api/admin/reports/leave-summary?from=${$('#leaveFrom').value}&to=${$('#leaveTo').value}&search=${encodeURIComponent($('#leaveSearch').value || '')}`
        );

        $('#leaveTrackingTable').innerHTML = rows.map(r => `
            <tr>
                <td>${esc(r.name)}</td>
                <td>${esc(r.employeeId)}</td>
                <td>${esc(r.department || '-')}</td>
                <td><b>${r.leaveDays}</b></td>
            </tr>
        `).join('') || emptyRow(4, 'No matching employees');
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function loadRequests() {
    const f = $('#requestFrom').value ||
        new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        ).toISOString().slice(0, 10);

    const t = $('#requestTo').value || today();

    try {
        const q = new URLSearchParams({
            from: f,
            to: t
        });

        if ($('#requestStatus').value) {
            q.set('status', $('#requestStatus').value);
        }

        if ($('#requestSearch').value) {
            q.set('search', $('#requestSearch').value);
        }

        const rows = await api('/api/admin/leaves?' + q);

        $('#requestTable').innerHTML = rows.map(l => `
            <tr>
                <td>${esc(l.employeeName)}</td>
                <td>${esc(l.employeeCode)}</td>
                <td>${fmt(l.fromDate)}</td>
                <td>${fmt(l.toDate)}</td>
                <td>${l.leaveDays}</td>
                <td>${esc(l.reason)}</td>
                <td>${esc(l.remarks) || '-'}</td>
                <td>${new Date(l.appliedDate).toLocaleDateString('en-IN')}</td>
                <td><span class="status ${l.status}">${l.status}</span></td>
                <td>
                    <div class="row-actions">
                        ${l.status === 'PENDING'
                            ? `<button data-approve="${l.id}">✓</button>
                               <button data-reject="${l.id}" class="delete">×</button>`
                            : ''}
                        <button data-delete-leave="${l.id}" class="delete">♲</button>
                    </div>
                </td>
            </tr>
        `).join('') || emptyRow(9, 'No leave requests found');

        $$('[data-approve]').forEach(b =>
            b.onclick = () => changeLeave(b.dataset.approve, 'APPROVED')
        );

        $$('[data-reject]').forEach(b =>
            b.onclick = () => changeLeave(b.dataset.reject, 'REJECTED')
        );

        $$('[data-delete-leave]').forEach(b =>
            b.onclick = () => deleteLeave(b.dataset.deleteLeave)
        );

        const pending = rows.filter(x => x.status === 'PENDING').length;

        $('#pendingBadge').textContent = pending || '';
        $('#bellBadge').textContent = pending || '0';
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function changeLeave(id, status) {
    let remarks = '';

    if (status === 'REJECTED') {
        remarks = prompt('Optional rejection remark:') ?? '';
    }

    try {
        await api('/api/admin/leaves/' + id + '/status', {
            method: 'PUT',
            body: JSON.stringify({
                status,
                adminRemarks: remarks
            })
        });

        await loadRequests();
        await loadDashboard();

        toast('Leave ' + status.toLowerCase());
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteLeave(id) {
    if (!confirm('Delete this leave request?')) return;

    try {
        await api('/api/admin/leaves/' + id, {
            method: 'DELETE'
        });

        await loadRequests();
        await loadDashboard();

        toast('Leave deleted');
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function loadHolidays() {
    try {
        const rows = await api('/api/admin/holidays');

        $('#holidayTable').innerHTML = rows.map(h => `
            <tr>
                <td>${fmt(h.holidayDate)}</td>
                <td>${esc(h.holidayName)}</td>
                <td>
                    <div class="row-actions">
                        <button class="delete" data-holiday-delete="${h.id}">♲ Delete</button>
                    </div>
                </td>
            </tr>
        `).join('') || emptyRow(3, 'No holidays added');

        $$('[data-holiday-delete]').forEach(b => {
            b.onclick = async () => {
                if (!confirm('Delete this holiday?')) return;

                try {
                    await api('/api/admin/holidays/' + b.dataset.holidayDelete, {
                        method: 'DELETE'
                    });

                    await loadHolidays();
                    await loadDashboard();

                    toast('Holiday deleted');
                } catch (e) {
                    toast(e.message, 'error');
                }
            };
        });
    } catch (e) {
        toast(e.message, 'error');
    }
}

function openHoliday() {
    openModal(`
        <div class="modal-head">
            <h2>Add Government Holiday</h2>
            <button class="close" id="closeModal">×</button>
        </div>
        <div class="modal-body">
            <form id="holidayForm">
                <div class="form-grid">
                    <label>Holiday Date
                        <input type="date" name="holidayDate" required>
                    </label>
                    <label>Holiday Name
                        <input name="holidayName" required placeholder="Christmas">
                    </label>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn light" id="closeModal2">Cancel</button>
                    <button class="btn primary">Save Holiday</button>
                </div>
            </form>
        </div>
    `);

    $('#closeModal').onclick = closeModal;
    $('#closeModal2').onclick = closeModal;

    $('#holidayForm').onsubmit = async e => {
        e.preventDefault();

        const d = Object.fromEntries(new FormData(e.target));

        try {
            await api('/api/admin/holidays', {
                method: 'POST',
                body: JSON.stringify(d)
            });

            closeModal();
            await loadHolidays();
            await loadDashboard();

            toast('Holiday added');
        } catch (err) {
            toast(err.message, 'error');
        }
    };
}

async function loadUsers() {
    try {
        const rows = await api('/api/admin/users');

        $('#userTable').innerHTML = rows.map(u => `
            <tr>
                <td>${esc(u.username)}</td>
                <td>${u.role}</td>
                <td>${esc(u.employeeCode || '-')}</td>
                <td>
                    <span class="status ${u.active ? 'ACTIVE' : 'INACTIVE'}">
                        ${u.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="row-actions">
                        <button data-user-edit="${u.id}">✎</button>
                        <button class="delete" data-user-delete="${u.id}">♲</button>
                    </div>
                </td>
            </tr>
        `).join('') || emptyRow(5, 'No users');

        $$('[data-user-edit]').forEach(b => {
            b.onclick = () => {
                api('/api/admin/users').then(rs =>
                    openUser(rs.find(x => x.id == b.dataset.userEdit))
                );
            };
        });

        $$('[data-user-delete]').forEach(b => {
            b.onclick = async () => {
                if (!confirm('Delete this user?')) return;

                try {
                    await api('/api/admin/users/' + b.dataset.userDelete, {
                        method: 'DELETE'
                    });

                    await loadUsers();
                    toast('User deleted');
                } catch (e) {
                    toast(e.message, 'error');
                }
            };
        });
    } catch (e) {
        toast(e.message, 'error');
    }
}

function openUser(u = null) {
    openModal(`
        <div class="modal-head">
            <h2>${u ? 'Edit User' : 'Add User'}</h2>
            <button class="close" id="closeModal">×</button>
        </div>
        <div class="modal-body">
            <form id="userForm">
                <div class="form-grid">
                    <label>Username
                        <input name="username" required value="${esc(u?.username || '')}">
                    </label>
                    <label>Password
                        <input name="password" type="password" ${u ? 'placeholder="Leave blank to keep current password"' : 'required'}>
                    </label>
                    <label>Role
                        <select name="role">
                            <option ${u?.role === 'USER' ? 'selected' : ''}>USER</option>
                            <option ${!u || u.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                        </select>
                    </label>
                    <label>Employee ID
                        <select name="employeeId">
                            <option value="">Not linked</option>
                            ${employees.map(e => `
                                <option value="${e.id}" ${u?.employeeId == e.id ? 'selected' : ''}>
                                    ${esc(e.employeeId)} - ${esc(e.name)}
                                </option>
                            `).join('')}
                        </select>
                    </label>
                    <label>Active
                        <select name="active">
                            <option value="true" ${u?.active !== false ? 'selected' : ''}>Active</option>
                            <option value="false" ${u?.active === false ? 'selected' : ''}>Inactive</option>
                        </select>
                    </label>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn light" id="closeModal2">Cancel</button>
                    <button class="btn primary">Save User</button>
                </div>
            </form>
        </div>
    `);

    $('#closeModal').onclick = closeModal;
    $('#closeModal2').onclick = closeModal;

    $('#userForm').onsubmit = async ev => {
        ev.preventDefault();

        const d = Object.fromEntries(new FormData(ev.target));

        d.active = d.active === 'true';
        d.employeeId = d.employeeId ? Number(d.employeeId) : null;

        try {
            await api(
                u ? '/api/admin/users/' + u.id : '/api/admin/users',
                {
                    method: u ? 'PUT' : 'POST',
                    body: JSON.stringify(d)
                }
            );

            closeModal();
            await loadUsers();

            toast(u ? 'User updated' : 'User added');
        } catch (err) {
            toast(err.message, 'error');
        }
    };
}

async function runReport() {
    const f = $('#reportFrom').value ||
        new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        ).toISOString().slice(0, 10);

    const t = $('#reportTo').value || today();

    $('#reportFrom').value = f;
    $('#reportTo').value = t;

    try {
        const rows = await api(
            `/api/admin/reports/leave-summary?from=${f}&to=${t}&search=${encodeURIComponent($('#reportSearch').value || '')}`
        );

        $('#reportTable').innerHTML = rows.map(r => `
            <tr>
                <td>${esc(r.employeeId)}</td>
                <td>${esc(r.name)}</td>
                <td>${esc(r.department || '-')}</td>
                <td><b>${r.leaveDays}</b></td>
            </tr>
        `).join('') || emptyRow(4, 'No results');

        $('#reportEmployees').textContent = rows.length;

        $('#reportDays').textContent = rows.reduce(
            (s, r) => s + r.leaveDays,
            0
        );
    } catch (e) {
        toast(e.message, 'error');
    }
}

function openModal(html) {
    $('#modalContent').innerHTML = html;
    $('#modalBackdrop').classList.remove('hidden');
}

function closeModal() {
    $('#modalBackdrop').classList.add('hidden');
    $('#modalContent').innerHTML = '';
}

function emptyRow(n, msg) {
    return `<tr><td colspan="${n}" style="text-align:center;padding:25px;color:#8193a8">${msg}</td></tr>`;
}

function esc(v) {
    return String(v ?? '').replace(/[&<>'"]/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[c]));
}

$('#addEmployeeBtn').onclick = () => openEmployee();
$('#dashAddEmployee').onclick = () => openEmployee();
$('#quickAddEmployee').onclick = () => openEmployee();

$('#addHolidayBtn').onclick = openHoliday;
$('#quickAddHoliday').onclick = openHoliday;

$('#addUserBtn').onclick = () => openUser();

$('#closeModal')?.addEventListener('click', closeModal);

$('#modalBackdrop').addEventListener('click', e => {
    if (e.target.id === 'modalBackdrop') closeModal();
});

$('#attendanceDate').onchange = loadAttendance;
$('#saveAttendance').onclick = saveAttendance;

$('#markAllPresent').onclick = async () => {
    try {
        await api(
            '/api/admin/attendance/mark-all-present?date=' +
            $('#attendanceDate').value,
            {
                method: 'POST'
            }
        );

        await loadAttendance();
        await loadDashboard();

        toast('All employees marked Present');
    } catch (e) {
        toast(e.message, 'error');
    }
};

$('#runLeaveTracking').onclick = loadLeaveTracking;

$('#leavePreset').onchange = () => {
    if ($('#leavePreset').value !== 'custom') loadLeaveTracking();
};

$('#refreshRequests').onclick = loadRequests;
$('#runReport').onclick = runReport;

$('#dashEmployeeSearch').oninput = () =>
    renderEmployees(
        filteredEmployees(
            $('#dashEmployeeSearch').value,
            $('#dashDept').value
        )
    );

$('#dashDept').onchange = () =>
    renderEmployees(
        filteredEmployees(
            $('#dashEmployeeSearch').value,
            $('#dashDept').value
        )
    );

$('#employeeSearch').oninput = () =>
    renderEmployees(
        filteredEmployees(
            $('#employeeSearch').value,
            $('#employeeDept').value
        )
    );

$('#employeeDept').onchange = () =>
    renderEmployees(
        filteredEmployees(
            $('#employeeSearch').value,
            $('#employeeDept').value
        )
    );

$('#globalSearch').oninput = e => {
    if (e.target.value.trim()) {
        showPage('employees');
        $('#employeeSearch').value = e.target.value;
        renderEmployees(filteredEmployees(e.target.value, ''));
    }
};

async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST'
        });
    } finally {
        location.href = '/';
    }
}

$('#logoutBtn').onclick = logout;

init();