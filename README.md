# Employee Performance Management System (EPMS)

EPMS is a modern, responsive web application built to streamline employee operations, track daily attendance metrics, organize team projects, and evaluate professional competencies. It features a stunning glassmorphic interface with vibrant neon accents.

---

## Technical Stack

* **Frontend**: React.js, React Router DOM, Vanilla CSS, custom SVG charting components.
* **Backend**: Node.js, Express.js (MVC Architecture).
* **Database**: MongoDB & Mongoose.
* **Authentication**: JSON Web Token (JWT) with Role-Based Access Control (RBAC).

---

## Folder Structure

### Backend (MVC Architecture)
```
backend/
├── config/
│   ├── db.js          # MongoDB connection
│   └── seed.js        # DB seed script for test credentials
├── controllers/       # Controller logic
│   ├── authController.js
│   ├── employeeController.js
│   ├── projectController.js
│   ├── attendanceController.js
│   └── performanceReviewController.js
├── middleware/        # Custom middlewares
│   └── authMiddleware.js # JWT + RBAC authorization
├── models/            # Mongoose Schemas (Data Layer)
│   ├── User.js
│   ├── Project.js
│   ├── Attendance.js
│   └── PerformanceReview.js
├── routes/            # Express Routes (Controller mounts)
│   ├── authRoutes.js
│   ├── employeeRoutes.js
│   ├── projectRoutes.js
│   ├── attendanceRoutes.js
│   └── performanceReviewRoutes.js
├── server.js          # App entry point
├── .env               # Port, DB, JWT configuration
└── test-epms-api.js   # Integration testing script
```

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── components/    # Tab sub-views
│   │   ├── DashboardOverview.jsx
│   │   ├── EmployeeManagement.jsx
│   │   ├── ProjectManagement.jsx
│   │   ├── AttendanceManagement.jsx
│   │   ├── PerformanceReviews.jsx
│   │   └── ProfileSettings.jsx
│   ├── context/
│   │   └── AuthContext.jsx # Auth state provider
│   ├── pages/         # Full pages
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   └── Dashboard.jsx   # Stateful navigation container
│   ├── App.jsx        # Routing configuration
│   ├── App.css        # Main glassmorphic neon stylesheet
│   └── main.jsx       # React entry point
```

---

## Default Accounts for Testing

A database seeder script is provided to pre-configure testing users. Run `npm run seed` in the `backend` folder to load them:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@epms.com` | `password123` |
| **Manager** | `manager@epms.com` | `password123` |
| **Employee** | `employee@epms.com` | `password123` |

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) installed.
* [MongoDB](https://www.mongodb.com/) running locally on port `27017` (or provide a remote connection string in the backend `.env`).

### 1. Setup Backend
1. Open a terminal in the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the database with default accounts:
   ```bash
   node config/seed.js
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *The server runs by default on port `5000`.*

### 2. Setup Frontend
1. Open a terminal in the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client web app will open at the default Vite URL (typically `http://localhost:5173`).*

---

## Testing API Integrations

The backend contains a test runner script (`test-epms-api.js`) that simulates registering users, updating profiles, completing attendance check-ins/outs, assigning managers, building projects, and writing competency reviews.

To run tests:
1. Ensure the backend server is running (`node server.js` or `npm run dev`).
2. Run:
   ```bash
   node test-epms-api.js
   ```
   *A clean output confirming all integration blocks pass will print in the console.*
