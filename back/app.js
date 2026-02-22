const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, './config/.env') });
const globalError = require('./middleware/ErrorMiddleware');
const express = require('express');
const cors = require('cors');


const db = require('./config/db');
const app = express();

// Import Routes
const authRouter = require('./routes/auth');
 const rolesRouter = require('./routes/roles'); // New RBAC route
 const userRouter = require('./routes/user');
const hotelRouter = require('./routes/hotels');
const departmentRouter = require('./routes/department');
const contactRouter = require('./routes/contact');
const cardRouter = require('./routes/cards');
const permissionRouter = require('./routes/permission');

// Middleware
app.set('trust proxy', true);

 app.use(cors());


app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
 app.use('/api/roles', rolesRouter); // New RBAC role management
 app.use('/api/departments', departmentRouter);
app.use('/api/users', userRouter);
app.use('/api/hotels', hotelRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/cards', cardRouter);
app.use('/api/permissions', permissionRouter);

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Backend is running',
        version: '2.0.0-RBAC',
        features: {
            'Role-Based Access Control': 'Enabled',
            'User Scope Management': 'Enabled',
            'Audit Logging': 'Enabled',
            'Permission Management': '/api/roles (New RBAC System)'
        }
    });
});

// Global Error Handler
app.use(globalError);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

console.log("Boot", {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
});