require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// health
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'ShopSphere API running', timestamp: new Date() })
);

// routes
app.use('/api/customers',  require('./src/routes/customerRoutes'));
app.use('/api/products',   require('./src/routes/productRoutes'));
app.use('/api/orders',     require('./src/routes/orderRoutes'));
app.use('/api/reviews',    require('./src/routes/reviewRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/suppliers',  require('./src/routes/supplierRoutes'));
app.use('/api/reports',    require('./src/routes/reportRoutes'));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`ShopSphere server running on port ${PORT}`));
