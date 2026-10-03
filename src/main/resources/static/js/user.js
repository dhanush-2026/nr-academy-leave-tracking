const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const api = async (url, opt = {}) => {
    const r = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(opt.headers || {})
        },
        ...opt
    });

    if (r.status === 401 || r.status === 403) {
        location.href = "/";
        throw new Error("Session expired or access denied");
    }

    let d = null;

    try {
        d = await r.json();
    } catch {}

    if (!r.ok) {
        throw new Error(d?.error || "Request failed");
    }

    return d;
};

const today = () => new Date().toISOString().slice(0, 10);

const fmt = d =>
    d
        ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric"
          })
        : "-";

const toast = (msg, type = "success") => {
    const el = document.createElement("div");

    el.className = "toast " + type;
    el.textContent = msg;

    $("#toastHost").appendChild(el);

    setTimeout(() => el.remove(), 2800);
};

let me;

/* =========================
   Page Navigation
========================= */

function showPage(name) {
    $$(".page").forEach(page => {
        page.classList.add("hidden");
    });

    $("#page-" + name)?.classList.remove("hidden");

    $$(".nav-item[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === name
        );
    });

    $("#sidebar").classList.remove("open");

    if (name === "dashboard") {
        loadDashboard();
    }

    if (name === "myLeaves") {
        loadMyLeaves();
    }

    if (name === "holidays") {
        loadHolidays();
    }

    if (name === "profile") {
        loadProfile();
    }
}

/* =========================
   Navigation Events
========================= */

$$("[data-page]").forEach(button => {
    button.onclick = () => {
        showPage(button.dataset.page);
    };
});

$$("[data-page-link]").forEach(button => {
    button.onclick = () => {
        showPage(button.dataset.pageLink);
    };
});

$("#mobileMenu").onclick = () => {
    $("#sidebar").classList.toggle("open");
};

/* =========================
   Initialization
========================= */

async function init() {
    try {
        me = await api("/api/auth/me");

if (me.role !== "EMPLOYEE") {
    document.body.innerHTML = `
        <h2>Access Denied</h2>
        <p>Please log out and sign in with the correct account.</p>
    `;
    return;
}

        const name = me.employee?.name || me.username;

        $("#topUsername").textContent = name;
        $("#topAvatar").textContent = name[0];

        $("#welcomeName").textContent = name;
        $("#welcomeAvatar").textContent = name[0];

        $("#welcomeText").textContent =
            `Welcome back, ${name}! 👋`;

        $("#todayLabel").textContent =
            new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

        $("#welcomeDate").textContent =
            $("#todayLabel").textContent;

        $("#leaveApplyFrom").value = today();
        $("#leaveApplyTo").value = today();

        await loadDashboard();
        await loadHolidays();

    } catch (e) {
        location.href = "/";
    }
}

/* =========================
   Dashboard
========================= */

async function loadDashboard() {
    try {
        const d = await api("/api/user/dashboard");

        $("#uApproved").textContent = d.approvedDays;
        $("#uPending").textContent = d.pendingRequests;
        $("#uRejected").textContent = d.rejectedRequests;
        $("#uMonth").textContent = d.currentMonthLeaveDays;

        $("#ringApproved").textContent = d.approvedDays;
        $("#ringA").textContent = d.approvedDays;
        $("#ringP").textContent = d.pendingRequests;
        $("#ringR").textContent = d.rejectedRequests;

        $("#recentUserLeaves").innerHTML =
            d.recentLeaves
                .map(
                    l => `
                    <tr>
                        <td>${fmt(l.fromDate)}</td>
                        <td>${fmt(l.toDate)}</td>
                        <td>${l.leaveDays}</td>
                        <td>${esc(l.reason)}</td>
                        <td>
                            <span class="status ${l.status}">
                                ${l.status}
                            </span>
                        </td>
                    </tr>
                `
                )
                .join("") ||
            emptyRow(5, "No leave history");

        renderBars("#userLeaveChart", d.leaveTrend || []);

    } catch (e) {
        toast(e.message, "error");
    }
}

/* =========================
   Bar Chart
========================= */

function renderBars(sel, data) {
    const max = Math.max(
        1,
        ...data.map(x => x.days)
    );

    $(sel).innerHTML = data
        .map(
            x => `
            <div class="bar-col">
                <span class="bar-value">
                    ${x.days}
                </span>

                <div
                    class="bar"
                    style="height:${Math.max(
                        3,
                        (x.days / max) * 145
                    )}px"
                ></div>

                <span class="bar-label">
                    ${x.month.slice(5)}
                </span>
            </div>
        `
        )
        .join("");
}

/* =========================
   My Leaves
========================= */

async function loadMyLeaves() {
    try {
        const f = $("#myFrom").value;
        const t = $("#myTo").value;

        const q = new URLSearchParams();

        if (f) {
            q.set("from", f);
        }

        if (t) {
            q.set("to", t);
        }

        const rows = await api(
            "/api/user/leaves?" + q
        );

        const status = $("#myStatus").value;

        const data = rows.filter(
            x => !status || x.status === status
        );

        $("#myLeavesTable").innerHTML =
            data
                .map(
                    l => `
                    <tr>
                        <td>${fmt(l.fromDate)}</td>
                        <td>${fmt(l.toDate)}</td>
                        <td>${l.leaveDays}</td>
                        <td>${esc(l.reason)}</td>
                        <td>
                            <span class="status ${l.status}">
                                ${l.status}
                            </span>
                        </td>
                        <td>
                            ${esc(l.adminRemarks || "-")}
                        </td>
                    </tr>
                `
                )
                .join("") ||
            emptyRow(
                6,
                "No matching leave records"
            );

    } catch (e) {
        toast(e.message, "error");
    }
}

/* =========================
   Holidays
========================= */

async function loadHolidays() {
    try {
        const rows =
            await api("/api/user/holidays");

        $("#userHolidayTable").innerHTML =
            rows
                .map(
                    h => `
                    <tr>
                        <td>${fmt(h.holidayDate)}</td>
                        <td>${esc(h.holidayName)}</td>
                    </tr>
                `
                )
                .join("") ||
            emptyRow(2, "No holidays");

    } catch (e) {
        toast(e.message, "error");
    }
}

/* =========================
   Profile
========================= */

async function loadProfile() {
    try {
        const d = await api("/api/auth/me");

        const e = d.employee;

        const emp =
            await api("/api/user/profile");

        $("#profileCard").innerHTML = `
            <div
                class="welcome-card"
                style="box-shadow:none;border:0;padding:0"
            >
                <div class="avatar large">
                    ${esc(e.name[0])}
                </div>

                <div>
                    <h2>${esc(e.name)}</h2>

                    <p>
                        ${esc(e.employeeId)}
                        ·
                        ${esc(emp.department || "")}
                    </p>
                </div>
            </div>

            <div class="profile-grid">

                <div>
                    <small>Employee ID</small>
                    <b>${esc(emp.employeeId)}</b>
                </div>

                <div>
                    <small>Department</small>
                    <b>${esc(emp.department || "-")}</b>
                </div>

                <div>
                    <small>Email</small>
                    <b>${esc(emp.email || "-")}</b>
                </div>

                <div>
                    <small>Phone</small>
                    <b>${esc(emp.phone || "-")}</b>
                </div>

                <div>
                    <small>Additional Phone</small>
                    <b>
                        ${esc(emp.additionalPhone || "-")}
                    </b>
                </div>

                <div>
                    <small>Date of Birth</small>
                    <b>${fmt(emp.dateOfBirth)}</b>
                </div>

                <div>
                    <small>Date of Joining</small>
                    <b>${fmt(emp.dateOfJoining)}</b>
                </div>

                <div>
                    <small>Blood Group</small>
                    <b>${esc(emp.bloodGroup || "-")}</b>
                </div>

                <div style="grid-column:1/-1">
                    <small>Address</small>
                    <b>${esc(emp.address || "-")}</b>
                </div>

            </div>
        `;

    } catch (e) {
        toast(e.message, "error");
    }
}

/* =========================
   Calculate Leave Days
========================= */

async function calculateDays() {
    const f = $("#leaveApplyFrom").value;
    const t = $("#leaveApplyTo").value;

    if (!f || !t) {
        $("#calculatedDays").textContent = "0 working days";
        return;
    }

    if (f > t) {
        $("#calculatedDays").textContent =
            "From Date cannot be after To Date";
        return;
    }

    try {
        const d = await api(
            `/api/user/leave-days?from=${f}&to=${t}`
        );

        $("#calculatedDays").textContent =
            `${d.days} working days`;

    } catch (e) {
        $("#calculatedDays").textContent =
            "Unable to calculate leave days";

        toast(e.message, "error");
    }
}

$("#leaveApplyFrom").onchange =
    calculateDays;

$("#leaveApplyTo").onchange =
    calculateDays;

/* =========================
   Clear Leave Form
========================= */

$("#clearLeave").onclick = () => {
    $("#leaveForm").reset();

    $("#leaveApplyFrom").value = today();
    $("#leaveApplyTo").value = today();

    calculateDays();
};

/* =========================
   Submit Leave
========================= */

$("#leaveForm").onsubmit = async e => {
    e.preventDefault();

    const data = {
        fromDate: $("#leaveApplyFrom").value,
        toDate: $("#leaveApplyTo").value,
        reason: $("#leaveReason").value,
        description: $("#leaveDescription").value
    };

    try {
        const r = await api("/api/user/leaves", {
            method: "POST",
            body: JSON.stringify(data)
        });

        toast(
            `Leave request submitted: ${r.leaveDays} applicable days`
        );

        e.target.reset();

        $("#leaveApplyFrom").value = today();
        $("#leaveApplyTo").value = today();

        $("#calculatedDays").textContent =
            "0 working days";

        await loadDashboard();

        showPage("myLeaves");

    } catch (err) {
        toast(err.message, "error");
    }
};

/* =========================
   Leave Filters
========================= */

$("#refreshMyLeaves").onclick =
    loadMyLeaves;

$("#myStatus").onchange =
    loadMyLeaves;

/* =========================
   Search
========================= */

$("#globalDummy")?.remove();

$("#userSearch").oninput = e => {
    if (e.target.value.trim()) {
        showPage("myLeaves");
    }
};

/* =========================
   Logout
========================= */

async function logout() {
    try {
        await fetch("/api/auth/logout", {
            method: "POST"
        });
    } finally {
        location.href = "/";
    }
}

$("#logoutBtn").onclick = logout;

/* =========================
   Utility Functions
========================= */

function emptyRow(n, msg) {
    return `
        <tr>
            <td
                colspan="${n}"
                style="
                    text-align:center;
                    padding:25px;
                    color:#8193a8;
                "
            >
                ${msg}
            </td>
        </tr>
    `;
}

function esc(v) {
    return String(v ?? "").replace(
        /[&<>'"]/g,
        c =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;"
            })[c]
    );
}

/* =========================
   Change Password
========================= */

$("#changePasswordForm").onsubmit =
    async e => {
        e.preventDefault();

        const data =
            Object.fromEntries(
                new FormData(e.target)
            );

        try {
            await api(
                "/api/user/change-password",
                {
                    method: "PUT",
                    body: JSON.stringify(data)
                }
            );

            toast(
                "Password updated successfully",
                "success"
            );

            e.target.reset();

        } catch (err) {
            toast(err.message, "error");
        }
    };

/* =========================
   Start Application
========================= */

init();