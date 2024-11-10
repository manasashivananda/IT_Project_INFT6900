const mongoose = require('mongoose');


// Define Address Schema
const addressSchema = new mongoose.Schema({
  streetName: { type: String, required: true },
  cityName: { type: String, required: true },
  postalZone: { type: String, required: true },
  country: { type: String, required: true },
});

// Define Tax Schema
const taxSchema = new mongoose.Schema({
  taxTypeCode: { type: String, required: true }, // e.g., "GST", "VAT"
  taxAmount: { type: Number, required: true },
  taxPercent: { type: Number, required: true },
  categoryCode: { type: String }, // optional, e.g., "S" for standard rate
});

// Define Price Schema
const priceSchema = new mongoose.Schema({
  priceAmount: { type: Number, required: true },
  baseQuantity: { type: Number, required: true },
  currencyCode: { type: String, default: "USD" } // currency support
});

// Define Item Schema
const itemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: priceSchema, // Embed price schema
  isTaxable: { type: Boolean, default: false }, // New field for taxable status
  tax: taxSchema, // Embed tax schema
  lineTotalAmount: { type: Number, required: true },
});

// Define Party Schema for Supplier and Buyer
const partySchema = new mongoose.Schema({
  name: { type: String, required: true },
  globalID: { type: String }, // Optional global identifier, e.g., DUNS number
  taxNumber: { type: String },
  ssmNumber: { type: String }, // Specific to supplier
  address: addressSchema, // Embed address schema
  contact: {
    email: { type: String },
    phone: { type: String }
  }
});

// Define Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  currencyCode: { type: String, required: true }, // e.g., USD, EUR
  customCurrency: { type: String }, // Custom currency field if "Other" is selected

  // Supplier Information
  supplierParty: partySchema, // Embed party schema for supplier
  
  // Customer Information
  customerParty: partySchema, // Embed party schema for customer
  
  // Tax Type Information
  taxType: { type: String, required: true },
  customTaxType: { type: String }, // Custom tax type if "Other" is selected
  taxPercent: { type: Number }, // Overall tax percentage
  
  // Items
  items: [itemSchema], // Embed item schema
  
  // Totals and Adjustments
  additionalFee: { type: Number, default: 0 }, // New field for additional fees
  discount: { type: Number, default: 0 }, // New field for discounts
  totalAmount: { type: Number, required: true },
  taxTotal: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  payableAmount: { type: Number, required: true },
});

// Export the model
module.exports = mongoose.model('Invoice', invoiceSchema);
