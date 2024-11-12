require('dotenv').config(); 
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
const Invoice = require('./models/invoice');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const generateUBLXML = require('./util/ublInvoiceGenerator');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));
const js2xmlparser = require("js2xmlparser");
app.use(express.json()); // Make sure this is added before your routes


const moment = require('moment'); // Add moment.js for date formatting

// Register the Handlebars helper
hbs.registerHelper('formatDate', function(date) {
return moment(date).format('YYYY-MM-DD'); // Format the date to 'YYYY-MM-DD'
});

// Load environment variables
require('dotenv').config();

// Use the URI to connect to MongoDB
const mongoURI = process.env.MONGODB_URI;
console.log('Mongo URI:', process.env.MONGODB_URI);
console.log('Current Environment:', process.env.NODE_ENV);


if (!mongoURI) {
    console.error("MONGODB_URI is not defined!");
    process.exit(1);  // Exit the application if the URI is not defined
}


// Connect to MongoDB
mongoose.connect(mongoURI, { 
    serverSelectionTimeoutMS: 10000
})
.then(() => {
    console.log("MongoDB connected successfully!");
})
.catch((err) => {
    console.error(`Failed to connect to MongoDB: ${err.message}`);
});

// Disconnect and reconnect to the correct database
mongoose.disconnect()
  .then(() => {
    mongoose.connect(mongoURI, {  })
      .then(() => console.log('Connected to the invoices database!'))
      .catch(err => console.log('Error connecting to MongoDB:', err));
  })
  .catch(err => console.log('Error disconnecting from MongoDB:', err));

 // Set paths for views, partials, and static files
 const static_path = path.join(__dirname, '../public');
 const views_path = path.join(__dirname, '../templates/views');
 const partials_path = path.join(__dirname, '../templates/partials');

// Set Handlebars as view engine and configure partials
app.set('view engine', 'hbs');
app.set('views', views_path);
hbs.registerPartials(partials_path);

// **Set up session middleware here, before route definitions**
app.use(session({
  secret: process.env.SESSION_SECRET,  // Use your session secret
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production' && req.secure,  // Secure cookies only if HTTPS is used in production
    httpOnly: true, // Keep this for security
  }
}));


// Middleware setup
app.use(cors({
origin: '*', // Replace with your frontend URL or '*' to allow all origins (for testing only)
methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

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

// Login route
app.post("/login", async (req, res) => {
  console.log("Request body:", req.body);  // Log the incoming request body

  const { contactEmail, password } = req.body;

  if (!contactEmail || !password) {
    return res.status(400).json({ message: "Both email and password are required." });
  }

  // Find the user by email
  const user = await Registration.findOne({ contactEmail: contactEmail });

  // Log the user to see if we find the correct record
  console.log("Found user:", user);

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  // Check password against the stored hash
  const match = await bcrypt.compare(password, user.password);
  console.log("Password match:", match);  // Log if the password matches

  if (!match) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  // Set session variables
  req.session.user = {
    id: user._id,
    name: user.contactName,
    email: user.contactEmail,
    businessName: user.businessName,
    contactPhone: user.contactPhone,
  };

  console.log("Session after login:", req.session);  // Log session data

  // Send success response
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
app.get("/dashboard", isAuthenticated, async (req, res) => {
try {
  // Fetch statistics data from the API
  const statisticsResponse = await fetch('http://localhost:3000/api/statistics');
  if (!statisticsResponse.ok) {
    throw new Error(`Failed to fetch statistics: ${statisticsResponse.statusText}`);
  }
  const statistics = await statisticsResponse.json();

  // Fetch recent invoices
  const recentInvoices = await Invoice.find({})
    .sort({ issueDate: -1 })
    .limit(5);

  // Define currency symbols (expand this list as needed)
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    AUD: 'A$',
    GBP: '£',
    INR: '₹',
    // Add other currencies as needed
  };

  // Format recent activities with correct currency symbol
  const activities = recentInvoices.map(invoice => {
    const date = invoice.issueDate 
      ? new Date(invoice.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
      : "Unknown Date";

    const customerName = invoice.customerParty?.name || invoice.customerParty?.alternateName || "Unnamed Customer";
    const invoiceNumber = invoice.invoiceNumber || "Unknown Number";

    // Use currency symbol or fall back to currency code if symbol is not defined
  // Use currency symbol or fall back to currency code if symbol is not defined
const currencySymbol = currencySymbols[invoice.currency] || `${invoice.currency} `;
const totalAmount = invoice.totalAmount != null ? `${currencySymbol}${invoice.totalAmount}` : "Amount Unknown";


    return `🧾 Invoice #${invoiceNumber} created  on ${date}`;
  });

  // Render the dashboard with statistics and activities
  res.render("dashboard", {
    title: "Dashboard",
    user: req.session.user,
    statistics: {
      totalInvoicesCreated: statistics.totalInvoices || 0,
      invoicesDueThisMonth: statistics.dueThisMonth || 0,
      averageInvoiceAmount: statistics.averageInvoiceAmount || "0.00",
      totalClients: statistics.totalClients || 0,
    },
    activities: activities
  });
} catch (error) {
  console.error("Error fetching data for the dashboard:", error.message);
  res.render("dashboard", {
    title: "Dashboard",
    user: req.session.user,
    statistics: {
      totalInvoicesCreated: 0,
      invoicesDueThisMonth: 0,
      averageInvoiceAmount: "0.00",
      totalClients: 0,
    },
    activities: []
  });
}
});

// Endpoint for recent activities - Optional (if frontend fetches this separately)
app.get("/api/recent-activities", isAuthenticated, async (req, res) => {
try {
  const recentInvoices = await Invoice.find({})
    .sort({ issueDate: -1 })
    .limit(5);

  res.json(recentInvoices);
} catch (error) {
  console.error("Error fetching recent activities:", error.message);
  res.status(500).json({ error: "Failed to fetch recent activities." });
}
});

// Route to render e-invoice form
app.get('/invoice', isAuthenticated, (req, res) => {
res.render('e-invoice', { title: 'Create E-Invoice' });
});

app.post('/api/invoice', async (req, res) => {
try {
    const {
        invoiceNumber,
        issueDate,
        dueDate,
        currencyCode,
        businessName,
        ssmNumber,
        taxNumber,
        supplierAddress,
        buyerName,
        buyerAddress,
        additionalFee = 0,
        discount = 0,
        items,
        taxType,
    } = req.body;

    // Validate required fields
    if (!invoiceNumber || !issueDate || !dueDate || !currencyCode || !businessName || 
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

        if (!item.itemCode || !item.description || quantity <= 0 || price <= 0) {
            throw new Error('Invalid item data. Each item must have a code, description, positive quantity, and price.');
        }

        item.lineTotalAmount = quantity * price;
        totalAmount += item.lineTotalAmount;

        if (item.isTaxable && item.tax && item.tax.taxAmount) {
            totalTax += item.tax.taxAmount;
        }
    });

    totalAmount += additionalFee - discount;

    const newInvoice = new Invoice({
        invoiceNumber,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        currencyCode,
        taxType,
        items,
        additionalFee,
        discount,
        totalAmount,
        taxTotal: totalTax,
        grandTotal: totalAmount + totalTax,
        payableAmount: totalAmount + totalTax,
        supplierParty: {
            name: businessName,
            ssmNumber: ssmNumber,
            taxNumber: taxNumber,
            address: {
                streetName: supplierAddress.streetName,
                cityName: supplierAddress.cityName,
                postalZone: supplierAddress.postalZone,
                country: supplierAddress.country
            }
        },
        customerParty: {
            name: buyerName,
            address: {
                streetName: buyerAddress.streetName,
                cityName: buyerAddress.cityName,
                postalZone: buyerAddress.postalZone,
                country: buyerAddress.country
            }
        }
    });

    await newInvoice.save();

    const invoiceData = newInvoice.toObject({ getters: true });

    // Remove the _id field (or convert it to string) before XML conversion
    const removeNestedIds = (obj) => {
      if (Array.isArray(obj)) {
          obj.forEach(removeNestedIds);
      } else if (obj && typeof obj === 'object') {
          // Convert _id and id to string or remove them
          if (obj._id) obj._id = obj._id.toString();  // Convert ObjectId to string
          if (obj.id) obj.id = obj.id.toString();    // Convert id field to string

          // Recursively check and remove nested IDs
          Object.values(obj).forEach(removeNestedIds);
      }
  };
  removeNestedIds(invoiceData);

    // Convert invoice data to XML
    const xml = generateUBLXML(invoiceData);

    // Define file path to save the XML
    const filePath = path.join(__dirname, 'invoices', `${invoiceNumber}.xml`);

    // Save the XML to file
    fs.writeFileSync(filePath, xml, 'utf8');

    res.status(201).json({
        message: 'Invoice created successfully.',
        invoice: invoiceData,
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
    const filePath = path.join(__dirname, 'invoices', `${invoiceNumber}.xml`);

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
    const currentYear = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(currentYear, 0, 1)); // Start of the year in UTC
    const endOfYear = new Date(Date.UTC(currentYear + 1, 0, 1)); // Start of the next year in UTC

    const monthlyInvoices = Array(12).fill(0);
    const monthlyRevenue = Array(12).fill(0);

    // Filter invoices based on issueDate within the UTC-defined range
    const invoices = await Invoice.find({
        issueDate: { $gte: startOfYear, $lt: endOfYear }
    });

    // Log the total invoices retrieved
    console.log("Total Invoices Retrieved:", invoices.length);

    invoices.forEach(invoice => {
        // Log each invoice's date to confirm correct retrieval
        console.log("Invoice Date:", invoice.issueDate);

        if (!invoice.issueDate || isNaN(new Date(invoice.issueDate).getMonth())) {
            console.error("Invalid issueDate:", invoice.issueDate);
            return;
        }
        if (typeof invoice.totalAmount !== 'number' || isNaN(invoice.totalAmount)) {
            console.error("Invalid totalAmount:", invoice.totalAmount);
            return;
        }

        const month = new Date(invoice.issueDate).getUTCMonth(); // Get the month in UTC
        monthlyInvoices[month]++;
        monthlyRevenue[month] += invoice.totalAmount;
    });

    // Log the monthly data after calculation
    console.log("Monthly Invoices Count:", monthlyInvoices);
    console.log("Monthly Revenue Totals:", monthlyRevenue);

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
const invoiceId = req.query.invoiceId; // Get invoice ID from query
const message = "Invoice created successfully."; // Success message

// Log to check if both values are retrieved correctly
console.log('Invoice Number:', invoiceNumber);
console.log('Invoice ID:', invoiceId);

// Render the success page with title, message, invoice number, and invoice ID
res.render('invoice-success', { title: "Success", message, invoiceNumber, invoiceId });
});

// Route for error page
app.get('/invoice-error', (req, res) => {
const errorMessage = req.query.message; // Get error message from query
res.render('invoice-error', { title: "Error", message: errorMessage }); // Render the error page
});

// GET /api/invoice/:invoiceId
app.get('/api/invoice/:id', async (req, res) => {
try {
    const { id } = req.params;
    
    // Find invoice by the provided ID
    const invoice = await Invoice.findById(id);
    
    if (!invoice) {
        // If no invoice is found, respond with a 404
        return res.status(404).json({ message: 'Invoice not found.' });
    }

    // Return the found invoice
    res.status(200).json(invoice);
} catch (error) {
    console.error('Error retrieving invoice:', error);
    
    // Handle cases where the ID format is incorrect
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid invoice ID format.' });
    }

    // General server error response
    res.status(500).json({ message: 'Error retrieving invoice' });
}
});

app.delete('/api/invoice/delete/:invoiceNumber', async (req, res) => {
try {
    const { invoiceNumber } = req.params;
    const deletedInvoice = await Invoice.findOneAndDelete({ invoiceNumber });

    if (!deletedInvoice) {
        return res.status(404).json({ message: 'Invoice not found.' });
    }

    res.status(200).json({
        message: 'Invoice deleted successfully',
        invoiceNumber: deletedInvoice.invoiceNumber // Include invoice number in the response
    });
} catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Error deleting invoice' });
}
});


  //  PUT route to update invoice details
app.put('/invoice/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const updatedFields = req.body;

      if (!updatedFields || Object.keys(updatedFields).length === 0) {
          return res.status(400).json({ message: 'Fields to update are required.' });
      }

      // Using $set explicitly to update nested fields correctly
      const updatedInvoice = await Invoice.findByIdAndUpdate(
          id,
          { $set: updatedFields },
          {
              new: true, // Return the updated document
              runValidators: true // Validate fields based on the schema
          }
      );

      if (!updatedInvoice) {
          return res.status(404).json({ message: 'Invoice not found.' });
      }

      // Build response to show only updated fields
      const response = {
          message: 'Successfully updated.',
          updatedFields: {}
      };

      // Populate response with only updated fields
      Object.keys(updatedFields).forEach((field) => {
          response.updatedFields[field] = updatedInvoice.get(field);
      });

      res.status(200).json(response);
  } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ message: 'Error updating invoice' });
  }
});


// Define your GET route to load the edit page with the invoice data
app.get('/edit-invoice/:id', async (req, res) => {
try {
  const invoiceId = req.params.id;  // Get the invoice ID from the URL
  const invoice = await Invoice.findById(invoiceId);  // Fetch the invoice from MongoDB

  if (!invoice) {
    return res.status(404).send('Invoice not found');
  }

  // Render the 'edit-invoice' template and pass the invoice data
  res.render('edit-invoice', { invoice });
} catch (error) {
  console.error('Error fetching invoice:', error);
  res.status(500).send('Server error');
}
});


// Route to handle PUT request for updating the invoice
app.put('/api/invoice/:id', async (req, res) => {
try {
    const invoiceId = req.params.id;
    const updatedData = req.body;

    const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, updatedData, { new: true });

    if (!updatedInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(updatedInvoice); // Respond with the updated invoice
} catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Error updating invoice" });
}
});

// Start the server
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
