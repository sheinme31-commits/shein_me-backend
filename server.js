// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// DEBUG temporaire - à supprimer après vérification
console.log('CHARGILY_APP_KEY:', process.env.CHARGILY_APP_KEY ? `OK (commence par: ${process.env.CHARGILY_APP_KEY.substring(0, 10)}...)` : 'MANQUANTE ❌')

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

app.get('/', (req, res) => {
  res.json({ message: 'API Sneakers Store' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});