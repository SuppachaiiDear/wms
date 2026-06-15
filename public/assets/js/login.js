document.getElementById('loginForm')
.addEventListener('submit', async function (e) {

    e.preventDefault();

    console.log('LOGIN WORKING');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await axios.post('/api/auth/login', {
            username,
            password
        });

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        window.location.href = 'index.html';

    } catch (err) {
        console.log(err.response.data);
        alert(err.response?.data?.message || 'Login failed');
    }
});