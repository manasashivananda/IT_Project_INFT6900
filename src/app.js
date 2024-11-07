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
  const generateUBLXML = require('./util/ublInvoiceGenerator');
 


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
// app.post('/api/invoice', async (req, res) => {
//   try {
//       const {
//           invoiceNumber,
//           invoiceDate,
//           dueDate,
//           currencyCode,
//           businessName,
//           ssmNumber,
//           taxNumber,
//           supplierAddress,
//           buyerName,
//           buyerAddress,
//           additionalFee,
//           discount,
//           items,
//           taxType, // Ensure taxType is included
//       } = req.body;

//       // Validate required fields
//       if (!invoiceNumber || !invoiceDate || !dueDate || !currencyCode || !businessName || 
//           !ssmNumber || !taxNumber || !supplierAddress || !buyerName || !buyerAddress || 
//           !Array.isArray(items) || items.length === 0 || !taxType) {
//           return res.status(400).json({ message: 'All fields are required.' });
//       }

//       // Check for duplicate invoice number
//       const existingInvoice = await Invoice.findOne({ invoiceNumber });
//       if (existingInvoice) {
//           return res.status(400).json({ message: 'Invoice number already exists.' });
         
//       }

//       let totalAmount = 0;
//       let totalTax = 0;

//       items.forEach(item => {
//           const quantity = parseFloat(item.quantity) || 0;
//           const price = parseFloat(item.price.priceAmount) || 0;

//           // Ensure all required fields are present and valid
//           if (!item.itemCode || !item.description || quantity <= 0 || price <= 0) {
//               throw new Error('Invalid item data. Each item must have a code, description, positive quantity, and price.');
//           }

//           item.lineTotalAmount = quantity * price; // Calculate line total
//           totalAmount += item.lineTotalAmount;

//           // Calculate total tax if taxable
//           if (item.isTaxable) {
//               totalTax += item.tax.taxAmount; // Assuming taxAmount is already calculated
//           }
//       });

//       // Include additional fees and discounts
//       totalAmount += additionalFee - discount;

//       const newInvoice = new Invoice({
//           invoiceNumber,
//           issueDate: new Date(invoiceDate),
//           dueDate: new Date(dueDate),
//           currencyCode,
//           businessName,
//           ssmNumber,
//           taxNumber,
//           supplierAddress,
//           buyerName,
//           buyerAddress,
//           taxType,
//           items,
//           additionalFee,
//           discount,
//           totalAmount,
//           taxTotal: totalTax,
//           grandTotal: totalAmount,
//           payableAmount: totalAmount,
//       });

//       // Save invoice to MongoDB
//       await newInvoice.save();

//       // Generate XML in UBL format
//       const xmlContent = generateUBLXML({
//           invoiceNumber,
//           invoiceDate,
//           currency: currencyCode,
//           totalAmount,
//           taxAmount: totalTax,
//           items
//       });

//       // Define file path for saving XML
//       const invoiceDir = path.join(__dirname, 'invoices');
//       if (!fs.existsSync(invoiceDir)) {
//           fs.mkdirSync(invoiceDir);
//       }
//       const filePath = path.join(invoiceDir, `invoice_${invoiceNumber}.xml`);

//       // Write the XML content to a file
//       fs.writeFileSync(filePath, xmlContent);

//       // Send the response
//       res.status(201).json({
//           message: 'Invoice created successfully.',
//           invoice: newInvoice,
//           downloadLink: `/download-invoice-xml/${invoiceNumber}`
//       });

//   } catch (error) {
//       console.error('Error creating invoice:', error);
//       res.status(500).json({ message: `Error creating invoice: ${error.message}` });
     
//   }
// });

app.post('/api/invoice', async (req, res) => {
  try {
      const {
          invoiceNumber,
          invoiceDate,
          dueDate,
          currencyCode,
          businessName,
          ssmNumber,
          taxNumber,
          supplierAddress,
          buyerName,
          buyerAddress,
          additionalFee,
          discount,
          items,
          taxType, // Ensure taxType is included
      } = req.body;

      // Validate required fields
      if (!invoiceNumber || !invoiceDate || !dueDate || !currencyCode || !businessName || 
          !ssmNumber || !taxNumber || !supplierAddress || !buyerName || !buyerAddress || 
          !Array.isArray(items) || items.length === 0 || !taxType) {
          return res.status(400).json({ message: 'All fields are required.' });
      }

      // Check for duplicate invoice number
      const existingInvoice = await Invoice.findOne({ invoiceNumber });
      if (existingInvoice) {
          return res.status(400).json({ message: 'Invoice number already exists.' });
      }

      let totalAmount = 0;
      let totalTax = 0;

      items.forEach(item => {
          const quantity = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price.priceAmount) || 0;

          // Ensure all required fields are present and valid
          if (!item.itemCode || !item.description || quantity <= 0 || price <= 0) {
              throw new Error('Invalid item data. Each item must have a code, description, positive quantity, and price.');
          }

          item.lineTotalAmount = quantity * price; // Calculate line total
          totalAmount += item.lineTotalAmount;

          // Calculate total tax if taxable
          if (item.isTaxable) {
              totalTax += item.tax.taxAmount; // Assuming taxAmount is already calculated
          }
      });

      // Include additional fees and discounts
      totalAmount += additionalFee - discount;

      const newInvoice = new Invoice({
          invoiceNumber,
          issueDate: new Date(invoiceDate),
          dueDate: new Date(dueDate),
          currencyCode,
          businessName,
          ssmNumber,
          taxNumber,
          supplierAddress,
          buyerName,
          buyerAddress,
          taxType,
          items,
          additionalFee,
          discount,
          totalAmount,
          taxTotal: totalTax,
          grandTotal: totalAmount,
          payableAmount: totalAmount,
      });

      // // Save invoice to MongoDB
      // await newInvoice.save();
      try {
        // Save invoice to MongoDB
        await newInvoice.save();
        console.log("Invoice saved successfully!");
    } catch (error) {
        console.error("Error saving invoice:", error);
    }

      // Generate XML in UBL format
      const xmlContent = generateUBLXML({
          invoiceNumber,
          invoiceDate,
          currency: currencyCode,
          totalAmount,
          taxAmount: totalTax,
          items
      });

      // Define file path for saving XML
      const invoiceDir = path.join(__dirname, 'invoices');
      if (!fs.existsSync(invoiceDir)) {
          fs.mkdirSync(invoiceDir);
      }
      const filePath = path.join(invoiceDir, `invoice_${invoiceNumber}.xml`);

      // Write the XML content to a file
      fs.writeFileSync(filePath, xmlContent);

      // Send the response
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
      const currentYear = new Date().getFullYear();
      const monthlyInvoices = Array(12).fill(0);
      const monthlyRevenue = Array(12).fill(0);

      const invoices = await Invoice.find({
          invoiceDate: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) }
      });

      invoices.forEach(invoice => {
          const month = new Date(invoice.invoiceDate).getMonth();
          monthlyInvoices[month]++;
          monthlyRevenue[month] += invoice.totalAmount || 0; // Ensure totalAmount is defined
      });

      // Return the data
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





// New route for successful invoice creation
app.get('/invoice-success', (req, res) => {
  const invoiceNumber = req.query.invoiceNumber; // Get invoice number from query
  const message = "Invoice created successfully."; // Success message
  res.render('invoice-success', { title: "Success", message, invoiceNumber }); // Render the success page with title, message, and invoice number
});


// Route for error page
app.get('/invoice-error', (req, res) => {
  const errorMessage = req.query.message; // Get error message from query
  res.render('invoice-error', { title: "Error", message: errorMessage }); // Render the error page
});

  // Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

