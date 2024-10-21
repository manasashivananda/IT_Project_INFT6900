const mongoose = require('mongoose');

// Define the invoice schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  businessName: { type: String, required: true },
  ssmNumber: { type: String, required: true },
  taxNumber: { type: String, required: true },
  address: { type: String, required: true },
  contactName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  items: [
    {
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      total: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Create the Invoice model
const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
