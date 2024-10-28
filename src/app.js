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
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
 


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



 app.get("/dashboard", isAuthenticated, async (req, res) => {
   try {
     // Fetch statistics data from the API
     const statisticsResponse = await fetch('http://localhost:3000/api/statistics');
     if (!statisticsResponse.ok) {
       throw new Error(`Failed to fetch statistics: ${statisticsResponse.statusText}`);
     }
 
     const statistics = await statisticsResponse.json();
 
     // Render the dashboard with the retrieved statistics
     res.render("dashboard", {
       title: "Dashboard",
       user: req.session.user,
       statistics: {
         totalInvoicesCreated: statistics.totalInvoices || 0,
         invoicesDueThisMonth: statistics.dueThisMonth || 0,
         averageInvoiceAmount: statistics.averageInvoiceAmount || "0.00",
         totalClients: statistics.totalClients || 0,
       },
       activities: req.session.activities || []
     });
   } catch (error) {
     console.error("Error fetching statistics:", error.message);
 
     // Render the dashboard with default values if fetching statistics fails
     res.render("dashboard", {
       title: "Dashboard",
       user: req.session.user,
       statistics: {
         totalInvoicesCreated: 0,
         invoicesDueThisMonth: 0,
         averageInvoiceAmount: "0.00",
         totalClients: 0,
       }
     });
   }
 });
 

// Route to render e-invoice form
app.get('/invoice', isAuthenticated, (req, res) => {
  res.render('e-invoice', { title: 'Create E-Invoice' });
});


// POST route for invoice creation


// POST route for invoice creation


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

      // Generate XML
      const xml = create({ version: '1.0' })
          .ele('Invoice')
          .ele('InvoiceNumber').txt(invoiceNumber).up()
          .ele('InvoiceDate').txt(invoiceDate).up()
          .ele('BusinessName').txt(businessName).up()
          .ele('SSMNumber').txt(ssmNumber).up()
          .ele('TaxNumber').txt(taxNumber).up()
          .ele('Address').txt(address).up()
          .ele('BuyerName').txt(buyerName).up()
          .ele('BuyerAddress').txt(buyerAddress).up()
          .ele('DueDate').txt(dueDate).up()
          .ele('Items');

      items.forEach(item => {
          xml.ele('Item')
              .ele('ItemCode').txt(item.itemCode).up()
              .ele('Description').txt(item.description).up()
              .ele('Quantity').txt(item.quantity).up()
              .ele('UnitPrice').txt(item.price).up()
              .ele('Tax').txt(item.tax).up()
              .ele('Total').txt(item.total).up()
          .up();
      });

      xml.up()
          .ele('TotalAmount').txt(totalAmount).up();

      const xmlContent = xml.end({ prettyPrint: true });

      // Define file path for saving XML
      const invoiceDir = path.join(__dirname, 'invoices');
      if (!fs.existsSync(invoiceDir)) {
          fs.mkdirSync(invoiceDir);
      }
      const filePath = path.join(invoiceDir, `invoice_${invoiceNumber}.xml`);

      // Write the XML content to a file
      fs.writeFileSync(filePath, xmlContent);

      // Send the file download response
      res.status(201).json({
        message: 'Invoice created successfully.',
        invoice: newInvoice,
        downloadLink: `/download-invoice-xml/${invoiceNumber}`
      });

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

      // Define file path
      const filePath = path.join(__dirname, 'invoices', `invoice_${invoiceNumber}.xml`);

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
          return res.status(404).json({ message: 'XML file not found.' });
      }

      // Send the XML file for download
      res.download(filePath);
  } catch (error) {
      console.error('Error generating XML:', error);
      res.status(500).json({ message: 'Error generating XML file.' });
  }
});

// Endpoint to get a list of invoices for selection
// Define the `/api/invoices` route
app.get('/api/invoices', async (req, res) => {
  try {
    // Fetch only the required fields
    const invoices = await Invoice.find({}, 'invoiceNumber buyerName totalAmount');
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

app.get('/api/statistics', async (req, res) => {
  try {
      const totalInvoices = await Invoice.countDocuments();
      const outstandingInvoices = await Invoice.countDocuments({ dueDate: { $lt: new Date() }, status: 'unpaid' });
      const totalRevenue = await Invoice.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
      const dueThisMonth = await Invoice.countDocuments({
          dueDate: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
      });
      const averageInvoiceAmount = totalRevenue[0] ? totalRevenue[0].total / totalInvoices : 0;
      
      // Count unique clients based on buyerName
      const totalClients = await Invoice.distinct('buyerName').then(names => names.length);

      res.json({
          totalInvoices,
          outstandingInvoices,
          totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
          dueThisMonth,
          averageInvoiceAmount: averageInvoiceAmount.toFixed(2),
          totalClients
      });
  } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Error fetching statistics" });
  }
});



app.get('/api/performance-data', async (req, res) => {
    try {
        // Monthly invoices and revenue
        const currentYear = new Date().getFullYear();
        const monthlyInvoices = Array(12).fill(0);
        const monthlyRevenue = Array(12).fill(0);

        const invoices = await Invoice.find({
            invoiceDate: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) }
        });

        invoices.forEach(invoice => {
            const month = new Date(invoice.invoiceDate).getMonth();
            monthlyInvoices[month]++;
            monthlyRevenue[month] += invoice.totalAmount;
        });

        // Paid vs Unpaid Invoices
        const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
        const unpaidInvoices = await Invoice.countDocuments({ status: 'unpaid' });

        // Send the data as JSON response
        res.json({
            monthlyLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            monthlyInvoices,
            monthlyRevenue
        });
    } catch (error) {
        console.error('Error fetching performance data:', error);
        res.status(500).json({ message: 'Error fetching performance data' });
    }
});

  // Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});