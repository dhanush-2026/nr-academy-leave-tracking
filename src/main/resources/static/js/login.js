
const $ = (selector) => document.querySelector(selector);

const API_BASE_URL =
    'https://nr-academy-leave-tracking.onrender.com';

// Common API function
const api = async (url, opt = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...opt,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(opt.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        // Response may not contain JSON
    }

    if (!response.ok) {
        throw new Error(
            data.error || `Request failed: ${response.status}`
        );
    }

    return data;
};

// Check whether the user already has a valid session
(async () => {
    try {
        const me = await api('/api/auth/me');

        const role = me.role || me.employee?.role;

        if (role === 'ADMIN') {
            window.location.replace('/admin.html');
        } else if (role === 'EMPLOYEE' || role === 'USER') {
            window.location.replace('/user.html');
        }
    } catch (error) {
        // Not logged in; remain on the login page
    }
})();

// Show or hide password
const togglePassword = $('#togglePassword');

if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        const password = $('#password');

        password.type =
            password.type === 'password' ? 'text' : 'password';
    });
}

// Login form submission
const loginForm = $('#loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const loginError = $('#loginError');
        const username = $('#username').value.trim();
        const password = $('#password').value;

        loginError.textContent = '';

        if (!username || !password) {
            loginError.textContent = 'Please enter username and password.';
            return;
        }

        const submitButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            // Send login request
            console.log('Login button clicked - sending login request');
            const data = await api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            // Confirm that the backend saved the login session
            const me = await api('/api/auth/me');

            const role = me.role || me.employee?.role || data.role;

            if (role === 'ADMIN') {
                window.location.replace('/admin.html');
            } else if (
                role === 'EMPLOYEE' ||
                role === 'USER'
            ) {
                window.location.replace('/user.html');
            } else {
                loginError.textContent =
                    'Login succeeded, but the user role could not be identified.';
            }
        } catch (error) {
            loginError.textContent =
                error.message || 'Login failed. Please try again.';
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}
