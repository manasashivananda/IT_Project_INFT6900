const express = require('express');
  const mongoose = require('mongoose');
  const path = require('path');
  const hbs = require('hbs');  // Using hbs for Handlebars
  const bcrypt = require('bcrypt');
  const cors = require('cors');
  const bodyParser = require('body-parser');

  const fs = require('fs');
  const { create } = require('xmlbuilder2');
  const session = require("express-session"); // Import express-session
  require("dotenv").config();

  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // MongoDB connection
  mongoose.connect('mongodb://127.0.0.1:27017/invoices', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
  });
  
  mongoose.connection.on('connected', () => {
      console.log('Connected to MongoDB successfully!');
  });
  
  mongoose.connection.on('error', (err) => {
      console.error(`Failed to connect to MongoDB: ${err.message}`);
  });

   // Set paths for views, partials, and static files
   const static_path = path.join(__dirname, '../public');
   const views_path = path.join(__dirname, '../templates/views');
   const partials_path = path.join(__dirname, '../templates/partials');
  
 // Set Handlebars as view engine and configure partials
 app.set('view engine', 'hbs');
 app.set('views', views_path);
 hbs.registerPartials(partials_path);
 
 // Middleware setup
 app.use(cors());  // Enable CORS
 app.use(express.static(static_path));  // Serve static files (CSS, JS, images)
 app.use(bodyParser.json());  // Parse JSON bodies
 app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies
  // Define a route for the root URL
   app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });  // Render index.hbs from views directory
});

  // Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

