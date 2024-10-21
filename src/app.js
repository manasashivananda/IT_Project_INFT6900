const express = require('express');
  const mongoose = require('mongoose');
  const path = require('path');
  const hbs = require('hbs');  // Using hbs for Handlebars
  const bcrypt = require('bcrypt');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  const Registration = require("./models/registration");
  const fs = require('fs');
  const { create } = require('xmlbuilder2');
  const session = require("express-session"); // Import express-session
  require("dotenv").config();
  const Invoice = require('./models/invoice');

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

  // **Set up session middleware here, before route definitions**
app.use(
  session({
    secret: "f1e002393e1f9a4cea6e9274e0c8ba63ced2782485e883716eca733de9bb1e3f03045caa076a0ee22c1ae53c8d349c53d7a25b4c8feac0b388ff81b8cff0f82f", // Replace with your generated secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set secure to true if using HTTPS
  })
);
 
 // Middleware setup
 app.use(cors());  // Enable CORS
 app.use(express.static(static_path));  // Serve static files (CSS, JS, images)
 app.use(bodyParser.json());  // Parse JSON bodies
 app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies


  // Define a route for the root URL
   app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });  // Render index.hbs from views directory
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

// Route to handle form submission
app.post("/register", async (req, res) => {
    try {
      const {
        businessName,
        ssmNumber,
        taxNumber,
        contactName,
        contactEmail,
        contactPhone,
        address,
        password,
      } = req.body;
  
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10); // Hash with 10 salt rounds
  
      // Create a new registration document
      const newRegistration = new Registration({
        businessName,
        ssmNumber,
        taxNumber,
        contactName,
        contactEmail,
        contactPhone,
        address,
        password: hashedPassword, // Store the hashed password
      });
  
      // Save to MongoDB
      await newRegistration.save();
  
      // Send a success response back to the frontend
      res.status(200).json({ message: "Registration successful!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // Route to handle login
app.post("/login", async (req, res) => {
  const { contactEmail, password } = req.body;

  // Find user by email
  const user = await Registration.findOne({ contactEmail: contactEmail });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  // Check password against the hashed password
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  // Set session variables for the logged-in user
  req.session.user = {
    name: user.contactName,
    email: user.contactEmail,
    businessName: user.businessName,
    contactPhone: user.contactPhone,
  };

  console.log("Session after login:", req.session); // Log session data

  // Send success response back to the frontend
  res.json({ message: "Login successful!" });
});

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect("/login");
  }
}

  // Route to render the dashboard page
 // Route to render the dashboard page
app.get("/dashboard", isAuthenticated, (req, res) => {
  const user = req.session.user;
  const activities = req.session.activities || []; // Get activities from session
  res.render("dashboard", {
    title: "Dashboard",
    user: {
      ...user,
      activities, // Pass activities to the template
    },
    statistics: {
      totalRegistrations: 100,
      pendingInvoices: 5,
      completedInvoices: 95,
    },
  });
});

// Route to render e-invoice form
app.get('/invoice', isAuthenticated, (req, res) => {
  res.render('e-invoice', { title: 'Create E-Invoice' });
});


// POST route for invoice creation
app.post('/api/invoice', async (req, res) => {
  try {
      const { invoiceNumber, invoiceDate, businessName, ssmNumber, taxNumber, address, contactName, contactEmail, contactPhone, buyerName, buyerAddress, dueDate, items } = req.body;

      // Ensure items exist and is an array
      if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: 'Invoice must contain at least one item.' });
      }

      // Check for duplicate invoice number
      const existingInvoice = await Invoice.findOne({ invoiceNumber });
      if (existingInvoice) {
          return res.status(400).json({ message: 'Invoice number already exists.' });
      }

      let totalAmount = 0;
      items.forEach(item => {
          const quantity = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          const tax = parseFloat(item.tax) || 0;

          // Ensure all required fields are present and valid
          if (!item.itemCode || !item.description || quantity <= 0 || price <= 0) {
              throw new Error('Invalid item data. Each item must have a code, description, positive quantity, and price.');
          }

          // Calculate total for each item (including tax)
          item.total = (quantity * price) + ((tax / 100) * quantity * price);
          totalAmount += item.total;
      });

      const newInvoice = new Invoice({
          invoiceNumber,
          invoiceDate,
          businessName,
          ssmNumber,
          taxNumber,
          address,
          contactName,
          contactEmail,
          contactPhone,
          buyerName,
          buyerAddress,
          dueDate,
          items,
          totalAmount,
      });

      // Save invoice to MongoDB
      await newInvoice.save();
        // Add this activity to the session for recent activities
        const activityMessage = `Invoice #${invoiceNumber} created on ${invoiceDate}`;
        if (!req.session.activities) {
            req.session.activities = [];
        }
        req.session.activities.push(activityMessage);
      res.status(201).json({ message: 'Invoice created successfully.', invoice: newInvoice });
  } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ message: `Error creating invoice: ${error.message}` });
  }
});



// Route to download invoice as XML
app.get('/download-invoice-xml/:invoiceNumber', async (req, res) => {
  try {
      const { invoiceNumber } = req.params;

      // Fetch the invoice
      const invoice = await Invoice.findOne({ invoiceNumber });
      if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found.' });
      }

      // Create XML
      const xml = create({ version: '1.0' })
          .ele('Invoice')
          .ele('InvoiceNumber').txt(invoice.invoiceNumber).up()
          .ele('InvoiceDate').txt(invoice.invoiceDate).up()
          .ele('DueDate').txt(invoice.dueDate).up()  // Add due date to XML
          .ele('BusinessName').txt(invoice.businessName).up()
          .ele('SSMNumber').txt(invoice.ssmNumber).up()
          .ele('TaxNumber').txt(invoice.taxNumber).up()
          .ele('Address').txt(invoice.address).up()
          .ele('BuyerInformation')
              .ele('BuyerName').txt(invoice.buyerName).up()
              .ele('BuyerAddress').txt(invoice.buyerAddress).up()
          .up()
          .ele('Items');

      invoice.items.forEach(item => {
          xml.ele('Item')
              .ele('ItemCode').txt(item.itemCode).up()
              .ele('Description').txt(item.description).up()
              .ele('Quantity').txt(item.quantity).up()
              .ele('Price').txt(item.price).up()
              .ele('Tax').txt(item.tax).up()  // Add tax to XML
              .ele('Total').txt(item.total).up()
          .up();
      });

      xml.up()
          .ele('TotalAmount').txt(invoice.totalAmount).up();

      const xmlContent = xml.end({ prettyPrint: true });

      // Save XML to file
      const invoiceDir = path.join(__dirname, 'invoices');
      if (!fs.existsSync(invoiceDir)) {
          fs.mkdirSync(invoiceDir);
      }
      const filePath = path.join(invoiceDir, `invoice_${invoiceNumber}.xml`);
      fs.writeFileSync(filePath, xmlContent);

      // Send the file for download
      res.download(filePath);
  } catch (error) {
      console.error('Error generating XML:', error);
      res.status(500).json({ message: 'Error generating XML file.' });
  }
});

  // Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
