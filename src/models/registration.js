const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Registration table
const RegistrationSchema = new Schema({
    businessName: { type: String, required: true },
    ssmNumber: { type: String, required: true },
    taxNumber: { type: String, required: true },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    password:{type: String, required: true},
    address: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Creating the model
const RegisterBusiness = mongoose.model('Registration', RegistrationSchema);

module.exports = RegisterBusiness;