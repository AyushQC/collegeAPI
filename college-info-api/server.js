require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['https://ayushqc.github.io', 'http://localhost:3000', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'x-admin-token', 'authorization', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Explicit OPTIONS handler for all routes
app.options('*', cors());

app.use(express.json());

// Swagger UI setup
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Import routes
const collegeRoutes = require('./routes/colleges');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'College API is running',
    endpoints: {
      docs: '/api-docs',
      colleges: '/api/colleges',
      suggest: '/api/colleges/suggest'
    }
  });
});

app.use('/api/colleges', collegeRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API Docs: http://localhost:${PORT}/api-docs`);
  });
})
.catch((err) => console.error('MongoDB connection error:', err));
