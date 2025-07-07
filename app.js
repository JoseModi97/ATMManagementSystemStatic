$(document).ready(function () {
    // --- Data Storage (localStorage) ---
    const ACCOUNTS_STORAGE_KEY = 'atmAccounts';
    const LAST_CUSTOMER_ID_KEY = 'lastCustomerId';
    let accounts = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY)) || [];
    let currentUser = null; // To store the logged-in user's ID

    function saveAccounts() {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    }

    function findAccount(customerId) {
        return accounts.find(acc => acc.customer_id === customerId);
    }

    function generateCustomerId() {
        let lastId = parseInt(localStorage.getItem(LAST_CUSTOMER_ID_KEY)) || 10000;
        let newId = lastId + 1;
        while (findAccount(newId)) { // Ensure uniqueness, though sequential should be unique
            newId++;
        }
        localStorage.setItem(LAST_CUSTOMER_ID_KEY, newId.toString());
        return newId;
    }

    // --- UI Navigation ---
    function showView(viewId, isDashboardContent = false) {
        if (isDashboardContent) {
            // Hide all sections within dashboardContent first
            $('#dashboardContent section').hide();
            // Show the target section within dashboardContent
            $('#' + viewId).show();
            // Ensure dashboardView itself is visible
            $('#dashboardView').show();
            // Hide pre-login views
            $('#loginView, #createAccountView').hide();
        } else {
            // Hide all main sections and dashboard view
            $('section:not(#dashboardContent section)').hide(); // Hide sections that are direct children of body
            $('#dashboardView').hide();
            // Show the target top-level view (e.g., loginView)
            $('#' + viewId).show();
        }

        // Update active class for sidebar
        if (currentUser) {
            $('#dashboardSidebar .nav-link').removeClass('active');
            if (viewId === 'viewBalanceView' || viewId === 'depositView' || viewId === 'withdrawView' || viewId === 'transferView') {
                 // Construct the selector for the button based on the viewId
                let buttonId = viewId.replace('View', 'Btn');
                // For viewBalanceBtn, it's directly the ID
                if (viewId === 'viewBalanceView') buttonId = 'viewBalanceBtn';

                $('#' + buttonId).addClass('active');

                // If it's a dashboard content view, ensure the dashboard itself is visible
                // and the pre-login views are hidden
                $('#dashboardView').show();
                $('#loginView, #createAccountView').hide();

            } else if (viewId === 'dashboardView') {
                 // Default to view balance when dashboard is first shown
                $('#viewBalanceBtn').addClass('active');
            }
        }
    }

    function showModal(title, message) {
        $('#messageModalLabel').text(title);
        $('#messageModalBody').text(message);
        new bootstrap.Modal($('#messageModal')[0]).show();
    }

    // Initial view determination based on page and login state
    // This logic needs to run on both index.html and dashboard.html
    // We'll use window.location.pathname to differentiate
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage === 'dashboard.html') {
        currentUser = localStorage.getItem('currentUser'); // Retrieve logged-in user
        if (!currentUser) {
            window.location.href = 'index.html'; // Not logged in, redirect to login
        } else {
            // Logged in, setup dashboard
            $('#loginNav, #createAccountNav').parent().hide();
            $('#logoutNav').parent().show();
            showView('viewBalanceView', true); // Show balance by default
            // Update account balances
            const userAccount = findAccount(parseInt(currentUser));
            if (userAccount) {
                $('#checkingBalance').text(userAccount.checking_balance.toFixed(2));
                $('#savingsBalance').text(userAccount.savings_balance.toFixed(2));
            }
        }
    } else { // On index.html
        showView('loginView');
        $('#logoutNav').parent().hide();
        // $('#dashboardView').hide(); // dashboardView is no longer on index.html
    }


    // --- Navigation Links ---
    // These are for index.html primarily
    $('#loginNav').click(function (e) {
        e.preventDefault();
        showView('loginView');
    });

    $('#createAccountNav').click(function (e) {
        e.preventDefault();
        showView('createAccountView');
    });

    // This is for dashboard.html
    $('#logoutNav').click(function (e) {
        e.preventDefault();
        currentUser = null;
        localStorage.removeItem('currentUser'); // Clear stored user
        // Redirect to login page
        window.location.href = 'index.html';
        // showModal('Logout', 'You have been logged out.'); // Modal will be on index.html if needed
    });

    // --- Authentication ---
    $('#createAccountForm').submit(function (e) {
        e.preventDefault();
        const pin = $('#createPin').val(); // PIN is string
        const initialDeposit = parseFloat($('#initialDeposit').val());

        if (!pin || pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
            showModal('Error', 'PIN must be a number between 4 and 8 digits.');
            return;
        }
        if (initialDeposit < 0 || isNaN(initialDeposit)) {
            showModal('Error', 'Initial deposit cannot be negative and must be a number.');
            return;
        }

        const newCustomerId = generateCustomerId();

        accounts.push({
            customer_id: newCustomerId,
            security_pin: pin, // Store PIN as string
            checking_balance: initialDeposit,
            savings_balance: 0.00 // Default savings to 0
        });
        saveAccounts();
        
        // Show modal and on close, auto-fill login
        const successModal = new bootstrap.Modal($('#messageModal')[0]);
        $('#messageModalLabel').text('Account Created Successfully');
        $('#messageModalBody').text(`Your new Customer ID is: ${newCustomerId}. You will be taken to the login page with your credentials pre-filled.`);
        
        $('#messageModal').one('hidden.bs.modal', function () {
            $('#loginCustomerId').val(newCustomerId);
            $('#loginPin').val(pin);
            showView('loginView');
        });
        
        successModal.show();
        $('#createAccountForm')[0].reset();
        // showView('loginView'); // This is now handled by modal close event
    });

    $('#loginForm').submit(function (e) {
        e.preventDefault();
        const customerId = parseInt($('#loginCustomerId').val());
        const pin = $('#loginPin').val();

        if (isNaN(customerId) || !pin) {
            showModal('Error', 'Customer ID and PIN cannot be empty.');
            return;
        }

        const account = findAccount(customerId);
        if (account && account.security_pin === pin) {
            currentUser = customerId;
            localStorage.setItem('currentUser', currentUser); // Store current user ID

            // Redirect to dashboard page
            window.location.href = 'dashboard.html';
            // The rest of the UI update (hiding/showing navs, showing balance)
            // will be handled by the dashboard.html's script loading.
            // We can show a success modal here if desired, before redirect.
            // showModal('Login Successful', `Welcome, Customer ${currentUser}!`);
        } else {
            showModal('Authentication Failed', 'Invalid Customer ID or PIN.');
        }
        $('#loginForm')[0].reset();
    });

    // --- Dashboard Sidebar Navigation (for dashboard.html) ---
    // Note: These event listeners should ideally be in a script block on dashboard.html
    // or in a part of app.js that specifically runs for dashboard.html.
    // For simplicity in this exercise, they are here but might not fire if currentUser is not set
    // when app.js is initially parsed on dashboard.html before the localStorage check.
    // The initial setup for dashboard.html handles the first view.

    $('#exitBtn').click(function (e) {
        e.preventDefault();
        // This will trigger the logoutNav click handler which redirects
        $('#logoutNav').click();
    });

    $('#viewBalanceBtn').click(function (e) {
        e.preventDefault();
        if (!currentUser) return;
        const account = findAccount(currentUser);
        $('#checkingBalance').text(account.checking_balance.toFixed(2));
        $('#savingsBalance').text(account.savings_balance.toFixed(2));
        showView('viewBalanceView', true);
    });

    $('#depositBtn').click(function (e) {
        e.preventDefault();
        if (!currentUser) return;
        $('#depositForm')[0].reset();
        showView('depositView', true);
    });

    $('#withdrawBtn').click(function (e) {
        e.preventDefault();
        if (!currentUser) return;
        $('#withdrawForm')[0].reset();
        showView('withdrawView', true);
    });

    $('#transferBtn').click(function (e) {
        e.preventDefault();
        if (!currentUser) return;
        $('#transferForm')[0].reset();
        const fromAccountType = $('#transferFromAccount').val();
        $('#transferToAccount').val(fromAccountType === 'checking' ? 'savings' : 'checking');
        showView('transferView', true);
    });

    // --- Transaction Logic ---
    $('#depositForm').submit(function (e) {
        e.preventDefault();
        if (!currentUser) return;

        const accountType = $('#depositAccountType').val();
        const amount = parseFloat($('#depositAmount').val());

        if (isNaN(amount) || amount <= 0) {
            showModal('Error', 'Invalid deposit amount. Please enter a positive number.');
            return;
        }

        const account = findAccount(currentUser);
        if (accountType === 'checking') {
            account.checking_balance += amount;
        } else if (accountType === 'savings') {
            account.savings_balance += amount;
        }
        saveAccounts();
        showModal('Success', `Successfully deposited $${amount.toFixed(2)} into ${accountType}.`);
        // Update balance view in dashboard
        const accountData = findAccount(currentUser);
        $('#checkingBalance').text(accountData.checking_balance.toFixed(2));
        $('#savingsBalance').text(accountData.savings_balance.toFixed(2));
        showView('viewBalanceView', true);
    });

    $('#withdrawForm').submit(function (e) {
        e.preventDefault();
        if (!currentUser) return;

        const accountType = $('#withdrawAccountType').val();
        const amount = parseFloat($('#withdrawAmount').val());

        if (isNaN(amount) || amount <= 0) {
            showModal('Error', 'Invalid withdrawal amount. Please enter a positive number.');
            return;
        }

        const account = findAccount(currentUser);
        if (accountType === 'checking') {
            if (account.checking_balance >= amount) {
                account.checking_balance -= amount;
                saveAccounts();
                showModal('Success', `Successfully withdrew $${amount.toFixed(2)} from checking.`);
            } else {
                showModal('Error', 'Insufficient funds in checking account.');
                return;
            }
        } else if (accountType === 'savings') {
            if (account.savings_balance >= amount) {
                account.savings_balance -= amount;
                saveAccounts();
                showModal('Success', `Successfully withdrew $${amount.toFixed(2)} from savings.`);
            } else {
                showModal('Error', 'Insufficient funds in savings account.');
                return;
            }
        }
        // Update balance view in dashboard
        const accountData = findAccount(currentUser);
        $('#checkingBalance').text(accountData.checking_balance.toFixed(2));
        $('#savingsBalance').text(accountData.savings_balance.toFixed(2));
        showView('viewBalanceView', true);
    });

    $('#transferForm').submit(function (e) {
        e.preventDefault();
        if (!currentUser) return;

        const fromAccountType = $('#transferFromAccount').val();
        const toAccountType = $('#transferToAccount').val();
        const amount = parseFloat($('#transferAmount').val());

        if (fromAccountType === toAccountType) {
            showModal('Error', 'Cannot transfer to the same account type.');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            showModal('Error', 'Invalid transfer amount. Please enter a positive number.');
            return;
        }

        const account = findAccount(currentUser);
        if (fromAccountType === 'checking') {
            if (account.checking_balance >= amount) {
                account.checking_balance -= amount;
                account.savings_balance += amount;
            } else {
                showModal('Error', 'Insufficient funds in checking account for transfer.');
                return;
            }
        } else if (fromAccountType === 'savings') {
            if (account.savings_balance >= amount) {
                account.savings_balance -= amount;
                account.checking_balance += amount;
            } else {
                showModal('Error', 'Insufficient funds in savings account for transfer.');
                return;
            }
        }
        saveAccounts();
        showModal('Success', `Successfully transferred $${amount.toFixed(2)} from ${fromAccountType} to ${toAccountType}.`);
        // Update balance view in dashboard
        const accountData = findAccount(currentUser);
        $('#checkingBalance').text(accountData.checking_balance.toFixed(2));
        $('#savingsBalance').text(accountData.savings_balance.toFixed(2));
        showView('viewBalanceView', true);
    });
    
    // Logic to ensure "From" and "To" accounts in transfer are different
    $('#transferFromAccount').change(function() {
        const fromAccount = $(this).val();
        $('#transferToAccount').val(fromAccount === 'checking' ? 'savings' : 'checking');
    });

    $('#transferToAccount').change(function() {
        const toAccount = $(this).val();
        $('#transferFromAccount').val(toAccount === 'checking' ? 'savings' : 'checking');
    });

});
