const loadLayout = async () => {

    // Navbar
    const navbar =
        await fetch('/partials/navbar.html');

    document.getElementById(
        'navbar-container'
    ).innerHTML =
        await navbar.text();


    // Sidebar
    const sidebar =
        await fetch('/partials/sidebar.html');

    document.getElementById(
        'sidebar-container'
    ).innerHTML =
        await sidebar.text();


    // Footer
    const footer =
        await fetch('/partials/footer.html');

    document.getElementById(
        'footer-container'
    ).innerHTML =
        await footer.text();

    // Sidebar Toggle
    const sidebarToggle =
        document.body.querySelector('#sidebarToggle');

    if (sidebarToggle) {

        sidebarToggle.addEventListener(
            'click',
            event => {

                event.preventDefault();

                document.body.classList.toggle(
                    'sb-sidenav-toggled'
                );

                localStorage.setItem(
                    'sb|sidebar-toggle',
                    document.body.classList.contains(
                        'sb-sidenav-toggled'
                    )
                );
            }
        );
    }

    const user = JSON.parse(localStorage.getItem('user'));

    const loginUserName = document.getElementById('loginUserName');

    if (loginUserName && user) {
        loginUserName.innerText =
            user.fullname || user.username || '-';
    }
};


// Logout
const logout = () => {

    localStorage.removeItem('token');

    localStorage.removeItem('user');

    window.location.href =
        'login.html';
};


loadLayout();