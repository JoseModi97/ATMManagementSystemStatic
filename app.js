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
    function showView(viewId) {
        $('section').hide();
        $('#' + viewId).show();
    }

    function showModal(title, message) {
        $('#messageModalLabel').text(title);
        $('#messageModalBody').text(message);
        new bootstrap.Modal($('#messageModal')[0]).show();
    }

    // Initial view
    showView('loginView');
    $('#logoutNav').parent().hide();


    // --- Navigation Links ---
    $('#loginNav').click(function (e) {
        e.preventDefault();
        if (!currentUser) {
            showView('loginView');
        }
    });

    $('#createAccountNav').click(function (e) {
        e.preventDefault();
        if (!currentUser) {
            showView('createAccountView');
        }
    });

    $('#logoutNav').click(function (e) {
        e.preventDefault();
        currentUser = null;
        $('#loginNav, #createAccountNav').parent().show();
        $('#logoutNav').parent().hide();
        showView('loginView');
        $('#loginForm')[0].reset();
        showModal('Logout', 'You have been logged out.');
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
        showModal('Account Created Successfully', `Your new Customer ID is: ${newCustomerId}. Please remember it for login.`);
        $('#createAccountForm')[0].reset();
        showView('loginView');
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
            showView('accountMenuView');
            $('#loginNav, #createAccountNav').parent().hide();
            $('#logoutNav').parent().show();
            showModal('Login Successful', `Welcome, Customer ${currentUser}!`);
        } else {
            showModal('Authentication Failed', 'Invalid Customer ID or PIN.');
        }
        $('#loginForm')[0].reset();
    });

    // --- Account Menu Actions ---
    $('#exitBtn').click(function () {
        $('#logoutNav').click(); // Simulate logout
    });

    $('#viewBalanceBtn').click(function () {
        if (!currentUser) return;
        const account = findAccount(currentUser);
        $('#checkingBalance').text(account.checking_balance.toFixed(2));
        $('#savingsBalance').text(account.savings_balance.toFixed(2));
        showView('viewBalanceView');
    });

    $('#depositBtn').click(function () {
        if (!currentUser) return;
        $('#depositForm')[0].reset();
        showView('depositView');
    });

    $('#withdrawBtn').click(function () {
        if (!currentUser) return;
        $('#withdrawForm')[0].reset();
        showView('withdrawView');
    });

    $('#transferBtn').click(function () {
        if (!currentUser) return;
        $('#transferForm')[0].reset();
        // Pre-fill "To Account" based on "From Account" to avoid transferring to the same account
        const fromAccountType = $('#transferFromAccount').val();
        $('#transferToAccount').val(fromAccountType === 'checking' ? 'savings' : 'checking');
        showView('transferView');
    });

    // --- Back to Menu Buttons ---
    $('#backToMenuBtnBalance, #backToMenuBtnDeposit, #backToMenuBtnWithdraw, #backToMenuBtnTransfer').click(function () {
        showView('accountMenuView');
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
        showView('accountMenuView');
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
        showView('accountMenuView');
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
        showView('accountMenuView');
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
