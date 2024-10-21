const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },  // Add due date field
  businessName: { type: String, required: true },
  ssmNumber: { type: String, required: true },
  taxNumber: { type: String, required: true },
  address: { type: String, required: true },
  buyerName: { type: String, required: true },  // Add buyer name field
  buyerAddress: { type: String, required: true },  // Add buyer address field
  items: [
    {
      itemCode: { type: String, required: true },
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      tax: { type: Number, required: true },  // Add tax field
      total: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
});

module.exports = mongoose.model('Invoice', invoiceSchema);

