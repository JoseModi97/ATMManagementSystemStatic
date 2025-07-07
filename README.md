Software Requirements Specification (SRS)
ATM Management System (Web-based)
1. Introduction
1.1 Purpose
This document specifies the requirements for a web-based ATM Management System. The system enables users to create and manage personal bank accounts, authenticate securely, and perform basic financial operations (balance inquiry, deposits, withdrawals, transfers). The interface is built using Bootstrap 5, CSS, and jQuery, and account data is persisted using a TXT file.

1.2 Intended Audience
Developers implementing the system using front-end technologies and local file handling mechanisms (simulated server-side).

Testers validating transaction flow and error handling.

End-users interacting with the system to manage personal finances in a simulated environment.

1.3 Scope
The system allows users to:

Create a new account with a unique identifier and PIN.

Log in to their account using valid credentials.

View balances for checking and savings accounts.

Perform deposit, withdrawal, and transfer operations.

Maintain persistent account data across sessions using a file-based system.

The system will be deployed as a static single-page application (SPA) using Bootstrap5 and jQuery. Simulated backend operations (like file I/O) may be mocked or implemented with local file APIs or backend extensions if necessary.

2. Overall Description
2.1 Product Perspective
The ATM Management System is a standalone web application that simulates ATM operations. While traditionally server-side operations like file persistence are not available in the browser, this simulation assumes file interaction using either mock JSON or Node.js backend (optional) for TXT file integration.

2.2 Product Functions
User Interface: Responsive layout using Bootstrap 5, interactive forms powered by jQuery.

Authentication: Validates customer ID and PIN.

Account Management: Processes user transactions and maintains account data.

Data Storage: Simulated or real file-based data persistence (TXT file).

Error Handling: Manages incorrect input, insufficient funds, and authentication issues.

2.3 User Classes and Characteristics
User Class	Characteristics
Guest	Can create new accounts.
Registered User	Can log in and perform account-related operations.

2.4 Operating Environment
Client-side: Any modern browser (Chrome, Firefox, Edge).

Technologies: HTML5, CSS3, Bootstrap 5, jQuery 3.x

Optional: Backend in Node.js for real TXT file persistence.

2.5 Design and Implementation Constraints
Must follow responsive design principles.

Must ensure all logic (except file I/O) is handled on the front end.

LocalStorage or simulated TXT backend for persistence.

3. Functional Requirements
3.1 User Interface (UI)
FR1.1: The system shall display a main menu with options: Login, Create Account.

FR1.2: The UI shall allow the user to input numeric ID and PIN.

FR1.3: Upon login, the UI shall display options: View Balance, Deposit, Withdraw, Transfer, Exit.

3.2 Authentication
FR2.1: The system shall prompt for a customer ID and PIN for login.

FR2.2: The system shall validate credentials against stored data.

FR2.3: If credentials are invalid, the system shall display an error.

3.3 Account Management
FR3.1: The system shall allow creation of a new account with default balances.

FR3.2: The system shall display checking and savings balances.

FR3.3: The system shall allow deposits and withdrawals for each account type.

FR3.4: The system shall allow transfers between checking and savings accounts.

3.4 Data Storage
FR4.1: The system shall store account data in a TXT file or equivalent structure.

FR4.2: The system shall read from and write to the file when loading or updating account data.

FR4.3: Account data shall include: customer_id, PIN, checking_balance, savings_balance.

4. Non-functional Requirements
4.1 Usability
UI shall be intuitive, responsive, and mobile-friendly.

Use Bootstrap 5 components to improve accessibility and clarity.

4.2 Performance
All operations must complete within 1 second for 90% of interactions.

DOM manipulation and input validation must be optimized with jQuery.

4.3 Reliability
Data must persist across browser sessions (using TXT or localStorage as fallback).

Must prevent illegal operations (e.g., overdraft, negative amounts).

4.4 Maintainability
Code must be modular and follow best practices.

Follow Airbnb-style guide for JavaScript (jQuery-based) code organization.

4.5 Security (Simulated)
PIN input must be masked.

Prevent unauthorized access via client-side logic.

5. System Models
5.1 Use Case Diagram (Textual)
Use Case	Description
Create Account	User creates an account by entering a unique ID and PIN.
Login	User logs in using ID and PIN.
View Balance	User views checking/savings balance.
Deposit Funds	User deposits into checking/savings.
Withdraw Funds	User withdraws from checking/savings.
Transfer Funds	User transfers between checking and savings.

5.2 Data Model (Account Entity)
json
Copy
Edit
{
  "customer_id": 123456,
  "security_pin": 1234,
  "checking_balance": 250.75,
  "savings_balance": 1000.00
}
6. Error Handling Requirements
Error Type	Trigger	System Response
Invalid Input	Non-numeric or empty fields	Show error, re-prompt
Authentication Failure	Wrong ID or PIN	Show error, allow retry
Insufficient Funds	Withdraw/transfer > balance	Show error, block operation
Negative Amount	Amount < 0	Show error, re-prompt
Account Exists	Duplicate ID during creation	Show error, prompt for new ID

7. External Interface Requirements
7.1 User Interfaces
Bootstrap-based form for login/account creation.

Modal dialogs for transaction feedback.

Dynamic content update using jQuery DOM manipulation.

7.2 Software Interfaces
Optional: File I/O backend for TXT persistence (Node.js/Express).

Optional: jQuery AJAX if backend integration is needed.

8. Future Enhancements
Multi-user session support with backend APIs.

Integration with databases (SQLite/MySQL).

Add transaction history logs per user.

Biometric or OTP-based two-factor authentication.

