/* =========================================================
   COMMON HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => [...document.querySelectorAll(selector)];

/* =========================================================
   API HELPER
========================================================= */

const api = async (url, options = {}) => {

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    if (response.status === 401 || response.status === 403) {
        location.href = "/";
        throw new Error("Session expired or access denied");
    }

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        // Response does not contain JSON
    }

    if (!response.ok) {
        throw new Error(data?.error || "Request failed");
    }

    return data;
};

/* =========================================================
   DATE HELPERS
========================================================= */

const today = () => {
    return new Date().toISOString().slice(0, 10);
};

const fmt = (date) => {

    if (!date) {
        return "-";
    }

    return new Date(date + "T00:00:00")
        .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
};

/* =========================================================
   TOAST
========================================================= */

const toast = (message, type = "success") => {

    const element = document.createElement("div");

    element.className = "toast " + type;
    element.textContent = message;

    $("#toastHost").appendChild(element);

    setTimeout(() => {
        element.remove();
    }, 2800);
};

/* =========================================================
   GLOBAL DATA
========================================================= */

let employees = [];
let attendance = [];

/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(name) {

    $$(".page").forEach((page) => {
        page.classList.add("hidden");
    });

    const selectedPage = $("#page-" + name);

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
    }

    $$(".nav-item[data-page]").forEach((button) => {

        button.classList.toggle(
            "active",
            button.dataset.page === name
        );

    });

    $("#sidebar").classList.remove("open");

    if (name === "dashboard") {
        loadDashboard();
    }

    if (name === "employees") {
        loadEmployees();
    }

    if (name === "attendance") {
        loadAttendance();
    }

    if (name === "leaveTracking") {
        loadLeaveTracking();
    }

    if (name === "leaveRequests") {
        loadRequests();
    }

    if (name === "holidays") {
        loadHolidays();
    }

    if (name === "users") {
        loadUsers();
    }

    if (name === "reports") {
        runReport();
    }
}

/* =========================================================
   NAVIGATION EVENTS
========================================================= */

$$("[data-page]").forEach((button) => {

    button.onclick = () => {
        showPage(button.dataset.page);
    };

});

$$("[data-page-link]").forEach((button) => {

    button.onclick = () => {
        showPage(button.dataset.pageLink);
    };

});

$("#mobileMenu").onclick = () => {
    $("#sidebar").classList.toggle("open");
};

/* =========================================================
   INITIALIZATION
========================================================= */

async function init() {

    try {

        const me = await api("/api/auth/me");

        /*
         * Only ADMIN can access admin.html
         */
        if (me.role !== "ADMIN") {
            location.href = "/user.html";
            return;
        }

        $("#topUsername").textContent = me.username;

        $("#todayLabel").textContent =
            new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

        $("#attendanceDate").value = today();

        const firstDay = new Date();

        firstDay.setDate(1);

        $("#leaveFrom").value =
            firstDay.toISOString().slice(0, 10);

        $("#leaveTo").value = today();

        $("#requestFrom").value =
            firstDay.toISOString().slice(0, 10);

        $("#requestTo").value = today();

        $("#reportFrom").value =
            firstDay.toISOString().slice(0, 10);

        $("#reportTo").value = today();

        await loadEmployees(true);
        await loadDashboard();
        await loadHolidays();
        await loadRequests();

    } catch (error) {

        console.error(error);

        if (!location.pathname.endsWith("index.html")) {
            location.href = "/";
        }
    }
}

/* =========================================================
   EMPLOYEE MANAGEMENT
========================================================= */

async function loadEmployees(silent = false) {

    try {

        employees = await api("/api/admin/employees");

        renderEmployeeOptions();

        renderEmployees(employees);

        if (!silent) {
            toast("Employee list refreshed");
        }

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   EMPLOYEE DEPARTMENT OPTIONS
========================================================= */

function renderEmployeeOptions() {

    const departments = [
        ...new Set(
            employees
                .map((employee) => employee.department)
                .filter(Boolean)
        )
    ].sort();

    ["employeeDept", "dashDept"].forEach((id) => {

        const element = $("#" + id);

        if (!element) {
            return;
        }

        const currentValue = element.value;

        element.innerHTML =
            '<option value="">All Departments</option>' +
            departments
                .map(
                    (department) =>
                        `<option value="${esc(department)}">${esc(department)}</option>`
                )
                .join("");

        element.value = currentValue;
    });
}

/* =========================================================
   FILTER EMPLOYEES
========================================================= */

function filteredEmployees(search = "", department = "") {

    const searchText = search.toLowerCase();

    return employees.filter((employee) => {

        const matchesSearch =
            !searchText ||
            employee.name
                ?.toLowerCase()
                .includes(searchText) ||
            employee.employeeId
                ?.toLowerCase()
                .includes(searchText);

        const matchesDepartment =
            !department ||
            employee.department === department;

        return matchesSearch && matchesDepartment;
    });
}

/* =========================================================
   RENDER EMPLOYEES
========================================================= */

function renderEmployees(list) {

    $("#employeeTable").innerHTML =
        list
            .map((employee) => employeeRow(employee))
            .join("") ||
        emptyRow(10, "No employees found");

    $("#dashEmployeeTable").innerHTML =
        list
            .slice(0, 12)
            .map((employee) => dashEmployeeRow(employee))
            .join("") ||
        emptyRow(8, "No employees found");

    bindEmployeeActions();
}

/* =========================================================
   EMPLOYEE TABLE ROW
========================================================= */

function employeeRow(employee) {

    return `
        <tr>

            <td>
                <b>${esc(employee.employeeId)}</b>
            </td>

            <td>
                ${esc(employee.name)}
            </td>

            <td>
                ${esc(employee.department || "-")}
            </td>

            <td>
                ${esc(employee.email || "-")}
            </td>

            <td>
                ${esc(employee.phone || "-")}
            </td>

            <td>
                ${fmt(employee.dateOfBirth)}
            </td>

            <td>
                ${fmt(employee.dateOfJoining)}
            </td>

            <td>
                ${esc(employee.bloodGroup || "-")}
            </td>

            <td>
                <span class="status ${employee.active ? "ACTIVE" : "INACTIVE"}">
                    ${employee.active ? "Active" : "Inactive"}
                </span>
            </td>

            <td>

                <div class="row-actions">

                    <button
                        data-action="edit"
                        data-id="${employee.id}"
                        title="Edit">
                        ✎
                    </button>

                    <button
                        data-action="view"
                        data-id="${employee.id}"
                        title="View">
                        ◉
                    </button>

                    <button
                        class="delete"
                        data-action="delete"
                        data-id="${employee.id}"
                        title="Delete">
                        ♲
                    </button>

                </div>

            </td>

        </tr>
    `;
}

/* =========================================================
   DASHBOARD EMPLOYEE ROW
========================================================= */

function dashEmployeeRow(employee) {

    return `
        <tr>

            <td>
                ${esc(employee.employeeId)}
            </td>

            <td>
                ${esc(employee.name)}
            </td>

            <td>
                ${esc(employee.department || "-")}
            </td>

            <td>
                ${esc(employee.email || "-")}
            </td>

            <td>
                ${esc(employee.phone || "-")}
            </td>

            <td>
                ${fmt(employee.dateOfJoining)}
            </td>

            <td>
                <span class="status ${employee.active ? "ACTIVE" : "INACTIVE"}">
                    ${employee.active ? "Active" : "Inactive"}
                </span>
            </td>

            <td>

                <div class="row-actions">

                    <button
                        data-action="edit"
                        data-id="${employee.id}">
                        ✎
                    </button>

                    <button
                        class="delete"
                        data-action="delete"
                        data-id="${employee.id}">
                        ♲
                    </button>

                </div>

            </td>

        </tr>
    `;
}

/* =========================================================
   EMPLOYEE BUTTON ACTIONS
========================================================= */

function bindEmployeeActions() {

    $$("[data-action]").forEach((button) => {

        button.onclick = () => {

            const employee = employees.find(
                (item) => item.id == button.dataset.id
            );

            if (!employee) {
                return;
            }

            if (button.dataset.action === "edit") {
                openEmployee(employee);
            }

            else if (button.dataset.action === "view") {
                openEmployee(employee, true);
            }

            else if (button.dataset.action === "delete") {
                deleteEmployee(employee);
            }
        };
    });
}

/* =========================================================
   ADD / EDIT EMPLOYEE MODAL
========================================================= */

function openEmployee(employee = null, view = false) {

    openModal(`

        <div class="modal-head">

            <h2>
                ${
                    view
                        ? "Employee Details"
                        : employee
                            ? "Edit Employee"
                            : "Add Employee"
                }
            </h2>

            <button
                class="close"
                id="closeModal">
                ×
            </button>

        </div>

        <div class="modal-body">

            <form id="employeeForm">

                <div class="form-grid">

                    <!-- EMPLOYEE ID -->

                    <label>
                        Employee ID

                        <input
                            name="employeeId"
                            required
                            value="${esc(employee?.employeeId || "")}"
                            ${view ? "disabled" : ""}
                        >
                    </label>


                    <!-- NAME -->

                    <label>
                        Name

                        <input
                            name="name"
                            required
                            value="${esc(employee?.name || "")}"
                            ${view ? "disabled" : ""}
                        >
                    </label>


                    <!-- DEPARTMENT -->

                    <label>
                        Department

                        <input
                            name="department"
                            value="${esc(employee?.department || "")}"
                            ${view ? "disabled" : ""}
                        >
                    </label>


                    <!-- EMAIL -->

                    <label>
                        Email

                        <input
                            name="email"
                            type="email"
                            value="${esc(employee?.email || "")}"
                            ${view ? "disabled" : ""}
                        >
                    </label>


                    <!-- PHONE -->

                    <label>
                        Phone

                        <input
                            name="phone"
                            value="${esc(employee?.phone || "")}"
                            ${view ? "disabled" : ""}
                        >
                    </label>


                    <!-- ADDITIONAL PHONE -->

                    <label>
                        Additional Phone

                        <input
                            name="additionalPhone"
                            value="${esc(employee?.additionalPhone || "")}"
                            ${view ? "disabled" : ""}
                        >
                    </label>


                    <!-- DATE OF BIRTH -->

                    <label>
                        Date of Birth

                        <input
                            name="dateOfBirth"
                            type="date"
                            value="${employee?.dateOfBirth || ""}"
                            ${view ? "disabled" : ""}
                        >
                    </label>


                    <!-- DATE OF JOINING -->

                    <label>
                        Date of Joining

                        <input
                            name="dateOfJoining"
                            type="date"
                            value="${employee?.dateOfJoining || ""}"
                            ${view ? "disabled" : ""}
                        >
                    </label>


                    <!-- BLOOD GROUP -->

                    <label>
                        Blood Group

                        <input
                            name="bloodGroup"
                            value="${esc(employee?.bloodGroup || "")}"
                            ${view ? "disabled" : ""}
                        >
                    </label>


                    <!-- ADDRESS -->

                    <label class="full-field">
                        Address

                        <textarea
                            name="address"
                            ${view ? "disabled" : ""}
                        >${esc(employee?.address || "")}</textarea>

                    </label>


                    <!-- PASSWORD -->

                    <label>
                        Password

                        <input
                            name="password"
                            type="text"
                            value=""
                            ${
                                view
                                    ? "disabled"
                                    : employee
                                        ? 'placeholder="Leave blank to keep current password"'
                                        : "required"
                            }
                        >

                    </label>

                </div>


                ${
                    view
                        ? ""
                        : `
                            <div class="modal-actions">

                                <button
                                    type="button"
                                    class="btn light"
                                    id="closeModal2">
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    class="btn primary">
                                    Save Employee
                                </button>

                            </div>
                        `
                }

            </form>

        </div>
    `);

    $("#closeModal").onclick = closeModal;

    $("#closeModal2")?.addEventListener(
        "click",
        closeModal
    );

    if (!view) {

        $("#employeeForm").onsubmit = async (event) => {

            event.preventDefault();

            const data = Object.fromEntries(
                new FormData(event.target)
            );

            data.active = true;

            try {

                await api(
                    employee
                        ? `/api/admin/employees/${employee.id}`
                        : "/api/admin/employees",
                    {
                        method: employee ? "PUT" : "POST",
                        body: JSON.stringify(data)
                    }
                );

                closeModal();

                await loadEmployees(true);

                await loadDashboard();

                toast(
                    employee
                        ? "Employee updated"
                        : "Employee added"
                );

            } catch (error) {

                console.error(error);

                toast(error.message, "error");
            }
        };
    }
}

/* =========================================================
   DELETE EMPLOYEE
========================================================= */

async function deleteEmployee(employee) {

    const confirmed = confirm(
        `Delete ${employee.name}?

This will permanently remove:
- Employee details
- Login account
- Leave records
- Attendance records
- Related report data

This action cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    try {

        await api(
            "/api/admin/employees/" + employee.id,
            {
                method: "DELETE"
            }
        );

        await loadEmployees(true);

        await loadDashboard();

        toast("Employee deleted");

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        const data = await api("/api/admin/dashboard");

        $("#mEmployees").textContent =
            data.totalEmployees;

        $("#mPresent").textContent =
            data.todayPresent;

        $("#mAbsent").textContent =
            data.todayAbsent;

        $("#mLeave").textContent =
            data.currentMonthLeaveDays;


        const total =
            data.todayPresent +
            data.todayAbsent;


        $("#mPresentPct").textContent =
            total
                ? Math.round(
                    data.todayPresent / total * 100
                ) + "% attendance"
                : "0% attendance";


        $("#donutTotal").textContent = total;

        $("#legendPresent").textContent =
            data.todayPresent;

        $("#legendAbsent").textContent =
            data.todayAbsent;


        const percentage =
            total
                ? data.todayPresent / total * 360
                : 360;


        $("#attendanceDonut").style.background =
            `conic-gradient(
                var(--blue) 0deg ${percentage}deg,
                var(--red) ${percentage}deg 360deg
            )`;


        renderBars(
            "#leaveChart",
            data.leaveTrend || []
        );


        $("#pendingBadge").textContent =
            data.pendingRequests || "";

        $("#bellBadge").textContent =
            data.pendingRequests || "0";


        renderRecent(data);


        if (!employees.length) {

            await loadEmployees(true);

        } else {

            renderEmployees(
                filteredEmployees(
                    $("#dashEmployeeSearch")?.value || "",
                    $("#dashDept")?.value || ""
                )
            );
        }

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   LEAVE TREND CHART
========================================================= */

function renderBars(selector, data) {

    const max = Math.max(
        1,
        ...data.map((item) => item.days)
    );

    $(selector).innerHTML = data
        .map((item) => {

            const height =
                Math.max(
                    3,
                    item.days / max * 145
                );

            return `
                <div class="bar-col">

                    <span class="bar-value">
                        ${item.days}
                    </span>

                    <div
                        class="bar"
                        style="height:${height}px">
                    </div>

                    <span class="bar-label">
                        ${item.month.slice(5)}
                    </span>

                </div>
            `;
        })
        .join("");
}

/* =========================================================
   RECENT LEAVE REQUESTS
========================================================= */

function renderRecent(data) {

    api(
        "/api/admin/leaves?from=" +
        encodeURIComponent(
            new Date(
                Date.now() - 45 * 86400000
            )
                .toISOString()
                .slice(0, 10)
        ) +
        "&to=" +
        today()
    )
        .then((rows) => {

            $("#recentRequests").innerHTML =
                rows
                    .slice(0, 4)
                    .map((leave) => {

                        return `
                            <div class="mini-item">

                                <div class="avatar">
                                    ${esc(
                                        leave.employeeName?.[0] || "?"
                                    )}
                                </div>

                                <div class="mini-main">

                                    <b>
                                        ${esc(
                                            leave.employeeName
                                        )}
                                    </b>

                                    <small>
                                        ${fmt(leave.fromDate)}
                                        -
                                        ${fmt(leave.toDate)}
                                        ·
                                        ${leave.leaveDays}
                                        days
                                    </small>

                                </div>

                                <span class="status ${leave.status}">
                                    ${leave.status}
                                </span>

                            </div>
                        `;
                    })
                    .join("") ||
                '<div class="mini-item">No recent requests</div>';

        })
        .catch((error) => {

            console.error(error);

        });


    $("#upcomingHolidays").innerHTML =
        (data.upcomingHolidays || [])
            .map((holiday) => {

                return `
                    <div class="mini-item">

                        <div class="action-icon">
                            ▣
                        </div>

                        <div class="mini-main">

                            <b>
                                ${fmt(holiday.date)}
                            </b>

                            <small>
                                ${esc(holiday.name)}
                            </small>

                        </div>

                    </div>
                `;
            })
            .join("") ||
        '<div class="mini-item">No upcoming holidays</div>';
}

/* =========================================================
   ATTENDANCE
========================================================= */

async function loadAttendance() {

    const date =
        $("#attendanceDate").value || today();

    $("#attendanceSelected").textContent =
        fmt(date);

    try {

        attendance = await api(
            "/api/admin/attendance?date=" + date
        );

        renderAttendance();

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   RENDER ATTENDANCE
========================================================= */

function renderAttendance() {

    $("#attendanceTable").innerHTML =
        attendance
            .map((item) => {

                return `
                    <tr>

                        <td>
                            ${esc(item.employeeCode)}
                        </td>

                        <td>
                            ${esc(item.name)}
                        </td>

                        <td>
                            <span class="status ${item.status}">
                                ${item.status}
                            </span>
                        </td>

                        <td>

                            <div class="attendance-status">

                                <button
                                    class="present-btn"
                                    data-att="PRESENT"
                                    data-id="${item.employeeId}">
                                    Present
                                </button>

                                <button
                                    class="absent-btn"
                                    data-att="ABSENT"
                                    data-id="${item.employeeId}">
                                    Absent
                                </button>

                            </div>

                        </td>

                    </tr>
                `;
            })
            .join("");


    $$("[data-att]").forEach((button) => {

        button.onclick = () => {

            const item = attendance.find(
                (attendanceItem) =>
                    attendanceItem.employeeId ==
                    button.dataset.id
            );

            if (!item) {
                return;
            }

            item.status =
                button.dataset.att;

            renderAttendance();
        };
    });
}

/* =========================================================
   SAVE ATTENDANCE
========================================================= */

async function saveAttendance() {

    try {

        await api(
            "/api/admin/attendance?date=" +
            $("#attendanceDate").value,
            {
                method: "PUT",
                body: JSON.stringify(
                    attendance.map((item) => ({
                        employeeId: item.employeeId,
                        status: item.status
                    }))
                )
            }
        );

        await loadDashboard();

        toast("Attendance saved");

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   LEAVE TRACKING
========================================================= */

async function loadLeaveTracking() {

    const preset =
        $("#leavePreset").value;

    const now = new Date();

    let from;
    let to;


    if (preset === "month") {

        from = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        to = now;

    }

    else if (preset === "3months") {

        from = new Date(
            now.getFullYear(),
            now.getMonth() - 2,
            1
        );

        to = now;

    }

    else if (preset === "year") {

        from = new Date(
            now.getFullYear() - 1,
            now.getMonth(),
            now.getDate()
        );

        to = now;

    }

    else {

        from = new Date(
            $("#leaveFrom").value +
            "T00:00:00"
        );

        to = new Date(
            $("#leaveTo").value +
            "T00:00:00"
        );
    }


    $("#leaveFrom").value =
        from.toISOString().slice(0, 10);

    $("#leaveTo").value =
        to.toISOString().slice(0, 10);


    try {

        const rows = await api(
            `/api/admin/reports/leave-summary?from=${$("#leaveFrom").value}&to=${$("#leaveTo").value}&search=${encodeURIComponent(
                $("#leaveSearch").value || ""
            )}`
        );


        $("#leaveTrackingTable").innerHTML =
            rows
                .map((row) => {

                    return `
                        <tr>

                            <td>
                                ${esc(row.name)}
                            </td>

                            <td>
                                ${esc(row.employeeId)}
                            </td>

                            <td>
                                ${esc(row.department || "-")}
                            </td>

                            <td>
                                <b>
                                    ${row.leaveDays}
                                </b>
                            </td>

                        </tr>
                    `;
                })
                .join("") ||
            emptyRow(
                4,
                "No matching employees"
            );

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   LEAVE REQUESTS
========================================================= */

async function loadRequests() {

    const from =
        $("#requestFrom").value ||
        new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        )
            .toISOString()
            .slice(0, 10);

    const to =
        $("#requestTo").value ||
        today();


    try {

        const query =
            new URLSearchParams({
                from: from,
                to: to
            });


        if ($("#requestStatus").value) {

            query.set(
                "status",
                $("#requestStatus").value
            );
        }


        if ($("#requestSearch").value) {

            query.set(
                "search",
                $("#requestSearch").value
            );
        }


        const rows = await api(
            "/api/admin/leaves?" + query
        );


        $("#requestTable").innerHTML =
            rows
                .map((leave) => {

                    return `
                        <tr>

                            <td>
                                ${esc(leave.employeeName)}
                            </td>

                            <td>
                                ${esc(leave.employeeCode)}
                            </td>

                            <td>
                                ${fmt(leave.fromDate)}
                            </td>

                            <td>
                                ${fmt(leave.toDate)}
                            </td>

                            <td>
                                ${leave.leaveDays}
                            </td>

                            <td>
                                ${esc(leave.reason)}
                            </td>

                            <td>
                                ${new Date(
                                    leave.appliedDate
                                ).toLocaleDateString("en-IN")}
                            </td>

                            <td>
                                <span class="status ${leave.status}">
                                    ${leave.status}
                                </span>
                            </td>

                            <td>

                                <div class="row-actions">

                                    ${
                                        leave.status === "PENDING"
                                            ? `
                                                <button
                                                    data-approve="${leave.id}">
                                                    ✓
                                                </button>

                                                <button
                                                    data-reject="${leave.id}"
                                                    class="delete">
                                                    ×
                                                </button>
                                            `
                                            : ""
                                    }

                                    <button
                                        data-delete-leave="${leave.id}"
                                        class="delete">
                                        ♲
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;
                })
                .join("") ||
            emptyRow(
                9,
                "No leave requests found"
            );


        $$("[data-approve]").forEach((button) => {

            button.onclick = () => {

                changeLeave(
                    button.dataset.approve,
                    "APPROVED"
                );
            };
        });


        $$("[data-reject]").forEach((button) => {

            button.onclick = () => {

                changeLeave(
                    button.dataset.reject,
                    "REJECTED"
                );
            };
        });


        $$("[data-delete-leave]").forEach((button) => {

            button.onclick = () => {

                deleteLeave(
                    button.dataset.deleteLeave
                );
            };
        });


        const pending =
            rows.filter(
                (row) => row.status === "PENDING"
            ).length;


        $("#pendingBadge").textContent =
            pending || "";

        $("#bellBadge").textContent =
            pending || "0";

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   CHANGE LEAVE STATUS
========================================================= */

async function changeLeave(id, status) {

    let remarks = "";

    if (status === "REJECTED") {

        remarks =
            prompt(
                "Optional rejection remark:"
            ) ?? "";
    }


    try {

        await api(
            "/api/admin/leaves/" +
            id +
            "/status",
            {
                method: "PUT",
                body: JSON.stringify({
                    status: status,
                    adminRemarks: remarks
                })
            }
        );


        await loadRequests();

        await loadDashboard();

        toast(
            "Leave " +
            status.toLowerCase()
        );

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   DELETE LEAVE
========================================================= */

async function deleteLeave(id) {

    if (!confirm("Delete this leave request?")) {
        return;
    }


    try {

        await api(
            "/api/admin/leaves/" + id,
            {
                method: "DELETE"
            }
        );

        await loadRequests();

        await loadDashboard();

        toast("Leave deleted");

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   HOLIDAYS
========================================================= */

async function loadHolidays() {

    try {

        const rows =
            await api("/api/admin/holidays");


        $("#holidayTable").innerHTML =
            rows
                .map((holiday) => {

                    return `
                        <tr>

                            <td>
                                ${fmt(holiday.holidayDate)}
                            </td>

                            <td>
                                ${esc(
                                    holiday.holidayName
                                )}
                            </td>

                            <td>

                                <div class="row-actions">

                                    <button
                                        class="delete"
                                        data-holiday-delete="${holiday.id}">
                                        ♲ Delete
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;
                })
                .join("") ||
            emptyRow(
                3,
                "No holidays added"
            );


        $$("[data-holiday-delete]").forEach(
            (button) => {

                button.onclick = async () => {

                    if (
                        !confirm(
                            "Delete this holiday?"
                        )
                    ) {
                        return;
                    }


                    try {

                        await api(
                            "/api/admin/holidays/" +
                            button.dataset.holidayDelete,
                            {
                                method: "DELETE"
                            }
                        );

                        await loadHolidays();

                        await loadDashboard();

                        toast("Holiday deleted");

                    } catch (error) {

                        console.error(error);

                        toast(
                            error.message,
                            "error"
                        );
                    }
                };
            }
        );

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   ADD HOLIDAY MODAL
========================================================= */

function openHoliday() {

    openModal(`

        <div class="modal-head">

            <h2>
                Add Government Holiday
            </h2>

            <button
                class="close"
                id="closeModal">
                ×
            </button>

        </div>


        <div class="modal-body">

            <form id="holidayForm">

                <div class="form-grid">

                    <label>

                        Holiday Date

                        <input
                            type="date"
                            name="holidayDate"
                            required>

                    </label>


                    <label>

                        Holiday Name

                        <input
                            name="holidayName"
                            required
                            placeholder="Christmas">

                    </label>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="btn light"
                        id="closeModal2">
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn primary">
                        Save Holiday
                    </button>

                </div>

            </form>

        </div>
    `);


    $("#closeModal").onclick =
        closeModal;

    $("#closeModal2").onclick =
        closeModal;


    $("#holidayForm").onsubmit =
        async (event) => {

            event.preventDefault();

            const data =
                Object.fromEntries(
                    new FormData(event.target)
                );


            try {

                await api(
                    "/api/admin/holidays",
                    {
                        method: "POST",
                        body: JSON.stringify(data)
                    }
                );

                closeModal();

                await loadHolidays();

                await loadDashboard();

                toast("Holiday added");

            } catch (error) {

                console.error(error);

                toast(
                    error.message,
                    "error"
                );
            }
        };
}

/* =========================================================
   USER MANAGEMENT
========================================================= */

async function loadUsers() {

    try {

        const rows =
            await api("/api/admin/users");


        $("#userTable").innerHTML =
            rows
                .map((user) => {

                    return `
                        <tr>

                            <td>
                                ${esc(user.username)}
                            </td>

                            <td>
                                ${user.role}
                            </td>

                            <td>
                                ${esc(
                                    user.employeeCode || "-"
                                )}
                            </td>

                            <td>

                                <span class="status ${
                                    user.active
                                        ? "ACTIVE"
                                        : "INACTIVE"
                                }">

                                    ${
                                        user.active
                                            ? "Active"
                                            : "Inactive"
                                    }

                                </span>

                            </td>

                            <td>

                                <div class="row-actions">

                                    <button
                                        data-user-edit="${user.id}">
                                        ✎
                                    </button>

                                    <button
                                        class="delete"
                                        data-user-delete="${user.id}">
                                        ♲
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;
                })
                .join("") ||
            emptyRow(
                5,
                "No users"
            );


        $$("[data-user-edit]").forEach(
            (button) => {

                button.onclick = async () => {

                    try {

                        const users =
                            await api(
                                "/api/admin/users"
                            );

                        const user =
                            users.find(
                                (item) =>
                                    item.id ==
                                    button.dataset.userEdit
                            );

                        if (user) {
                            openUser(user);
                        }

                    } catch (error) {

                        toast(
                            error.message,
                            "error"
                        );
                    }
                };
            }
        );


        $$("[data-user-delete]").forEach(
            (button) => {

                button.onclick = async () => {

                    if (
                        !confirm(
                            "Delete this user?"
                        )
                    ) {
                        return;
                    }


                    try {

                        await api(
                            "/api/admin/users/" +
                            button.dataset.userDelete,
                            {
                                method: "DELETE"
                            }
                        );

                        await loadUsers();

                        toast("User deleted");

                    } catch (error) {

                        console.error(error);

                        toast(
                            error.message,
                            "error"
                        );
                    }
                };
            }
        );

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   ADD / EDIT USER
========================================================= */

function openUser(user = null) {

    openModal(`

        <div class="modal-head">

            <h2>
                ${user ? "Edit User" : "Add User"}
            </h2>

            <button
                class="close"
                id="closeModal">
                ×
            </button>

        </div>


        <div class="modal-body">

            <form id="userForm">

                <div class="form-grid">

                    <!-- USERNAME -->

                    <label>

                        Username

                        <input
                            name="username"
                            required
                            value="${esc(
                                user?.username || ""
                            )}">

                    </label>


                    <!-- PASSWORD -->

                    <label>

                        Password

                        <input
                            name="password"
                            type="text"
                            ${
                                user
                                    ? 'placeholder="Leave blank to keep current password"'
                                    : "required"
                            }>

                    </label>


                    <!-- ROLE -->

                    <label>

                        Role

                        <select name="role">

                            <option
                                value="EMPLOYEE"
                                ${
                                    user?.role ===
                                    "EMPLOYEE"
                                        ? "selected"
                                        : ""
                                }>
                                EMPLOYEE
                            </option>

                            <option
                                value="ADMIN"
                                ${
                                    !user ||
                                    user.role ===
                                    "ADMIN"
                                        ? "selected"
                                        : ""
                                }>
                                ADMIN
                            </option>

                        </select>

                    </label>


                    <!-- EMPLOYEE -->

                    <label>

                        Employee ID

                        <select name="employeeId">

                            <option value="">
                                Not linked
                            </option>

                            ${employees
                                .map(
                                    (employee) => `
                                        <option
                                            value="${employee.id}"
                                            ${
                                                user?.employeeId ==
                                                employee.id
                                                    ? "selected"
                                                    : ""
                                            }>

                                            ${esc(
                                                employee.employeeId
                                            )}
                                            -
                                            ${esc(
                                                employee.name
                                            )}

                                        </option>
                                    `
                                )
                                .join("")}

                        </select>

                    </label>


                    <!-- ACTIVE -->

                    <label>

                        Active

                        <select name="active">

                            <option
                                value="true"
                                ${
                                    user?.active !== false
                                        ? "selected"
                                        : ""
                                }>
                                Active
                            </option>

                            <option
                                value="false"
                                ${
                                    user?.active === false
                                        ? "selected"
                                        : ""
                                }>
                                Inactive
                            </option>

                        </select>

                    </label>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="btn light"
                        id="closeModal2">
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn primary">
                        Save User
                    </button>

                </div>

            </form>

        </div>
    `);


    $("#closeModal").onclick =
        closeModal;

    $("#closeModal2").onclick =
        closeModal;


    $("#userForm").onsubmit =
        async (event) => {

            event.preventDefault();

            const data =
                Object.fromEntries(
                    new FormData(event.target)
                );


            data.active =
                data.active === "true";


            data.employeeId =
                data.employeeId
                    ? Number(data.employeeId)
                    : null;


            try {

                await api(
                    user
                        ? `/api/admin/users/${user.id}`
                        : "/api/admin/users",
                    {
                        method: user
                            ? "PUT"
                            : "POST",

                        body: JSON.stringify(data)
                    }
                );


                closeModal();

                await loadUsers();

                toast(
                    user
                        ? "User updated"
                        : "User added"
                );

            } catch (error) {

                console.error(error);

                toast(
                    error.message,
                    "error"
                );
            }
        };
}

/* =========================================================
   REPORTS
========================================================= */

async function runReport() {

    const from =
        $("#reportFrom").value ||
        new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        )
            .toISOString()
            .slice(0, 10);


    const to =
        $("#reportTo").value ||
        today();


    $("#reportFrom").value = from;

    $("#reportTo").value = to;


    try {

        const rows =
            await api(
                `/api/admin/reports/leave-summary?from=${from}&to=${to}&search=${encodeURIComponent(
                    $("#reportSearch").value || ""
                )}`
            );


        $("#reportTable").innerHTML =
            rows
                .map((row) => {

                    return `
                        <tr>

                            <td>
                                ${esc(row.employeeId)}
                            </td>

                            <td>
                                ${esc(row.name)}
                            </td>

                            <td>
                                ${esc(
                                    row.department ||
                                    "-"
                                )}
                            </td>

                            <td>
                                <b>
                                    ${row.leaveDays}
                                </b>
                            </td>

                        </tr>
                    `;
                })
                .join("") ||
            emptyRow(
                4,
                "No results"
            );


        $("#reportEmployees").textContent =
            rows.length;


        $("#reportDays").textContent =
            rows.reduce(
                (total, row) =>
                    total + row.leaveDays,
                0
            );

    } catch (error) {

        console.error(error);

        toast(error.message, "error");
    }
}

/* =========================================================
   MODAL FUNCTIONS
========================================================= */

function openModal(html) {

    $("#modalContent").innerHTML =
        html;

    $("#modalBackdrop")
        .classList
        .remove("hidden");
}


function closeModal() {

    $("#modalBackdrop")
        .classList
        .add("hidden");

    $("#modalContent").innerHTML = "";
}

/* =========================================================
   EMPTY TABLE ROW
========================================================= */

function emptyRow(columns, message) {

    return `
        <tr>

            <td
                colspan="${columns}"
                style="
                    text-align:center;
                    padding:25px;
                    color:#8193a8;
                ">

                ${message}

            </td>

        </tr>
    `;
}

/* =========================================================
   HTML ESCAPE
========================================================= */

function esc(value) {

    return String(value ?? "")
        .replace(
            /[&<>'"]/g,
            (character) => {

                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "'": "&#39;",
                    '"': "&quot;"
                }[character];

            }
        );
}

/* =========================================================
   BUTTON EVENTS
========================================================= */

$("#addEmployeeBtn").onclick = () => {
    openEmployee();
};


$("#dashAddEmployee").onclick = () => {
    openEmployee();
};


$("#quickAddEmployee").onclick = () => {
    openEmployee();
};


$("#addHolidayBtn").onclick =
    openHoliday;


$("#quickAddHoliday").onclick =
    openHoliday;


$("#addUserBtn").onclick = () => {
    openUser();
};


/* =========================================================
   MODAL BACKDROP
========================================================= */

$("#modalBackdrop").addEventListener(
    "click",
    (event) => {

        if (
            event.target.id ===
            "modalBackdrop"
        ) {
            closeModal();
        }
    }
);


/* =========================================================
   ATTENDANCE EVENTS
========================================================= */

$("#attendanceDate").onchange =
    loadAttendance;


$("#saveAttendance").onclick =
    saveAttendance;


$("#markAllPresent").onclick =
    async () => {

        try {

            await api(
                "/api/admin/attendance/mark-all-present?date=" +
                $("#attendanceDate").value,
                {
                    method: "POST"
                }
            );

            await loadAttendance();

            await loadDashboard();

            toast(
                "All employees marked Present"
            );

        } catch (error) {

            console.error(error);

            toast(
                error.message,
                "error"
            );
        }
    };


/* =========================================================
   LEAVE TRACKING EVENTS
========================================================= */

$("#runLeaveTracking").onclick =
    loadLeaveTracking;


$("#leavePreset").onchange =
    () => {

        if (
            $("#leavePreset").value !==
            "custom"
        ) {
            loadLeaveTracking();
        }
    };


/* =========================================================
   LEAVE REQUEST EVENTS
========================================================= */

$("#refreshRequests").onclick =
    loadRequests;


/* =========================================================
   REPORT EVENTS
========================================================= */

$("#runReport").onclick =
    runReport;


/* =========================================================
   DASHBOARD EMPLOYEE SEARCH
========================================================= */

$("#dashEmployeeSearch").oninput =
    () => {

        renderEmployees(
            filteredEmployees(
                $("#dashEmployeeSearch").value,
                $("#dashDept").value
            )
        );
    };


$("#dashDept").onchange =
    () => {

        renderEmployees(
            filteredEmployees(
                $("#dashEmployeeSearch").value,
                $("#dashDept").value
            )
        );
    };


/* =========================================================
   EMPLOYEE SEARCH
========================================================= */

$("#employeeSearch").oninput =
    () => {

        renderEmployees(
            filteredEmployees(
                $("#employeeSearch").value,
                $("#employeeDept").value
            )
        );
    };


$("#employeeDept").onchange =
    () => {

        renderEmployees(
            filteredEmployees(
                $("#employeeSearch").value,
                $("#employeeDept").value
            )
        );
    };


/* =========================================================
   GLOBAL SEARCH
========================================================= */

$("#globalSearch").oninput =
    (event) => {

        const value =
            event.target.value.trim();

        if (value) {

            showPage("employees");

            $("#employeeSearch").value =
                value;

            renderEmployees(
                filteredEmployees(
                    value,
                    ""
                )
            );
        }
    };


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        await fetch(
            "/api/auth/logout",
            {
                method: "POST"
            }
        );

    } finally {

        location.href = "/";
    }
}


$("#logoutBtn").onclick =
    logout;


$("#settingsLogout").onclick =
    logout;


/* =========================================================
   START APPLICATION
========================================================= */

init();