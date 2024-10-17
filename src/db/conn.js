const mongoose = require("mongoose");
//connect to mongodb server
mongoose.connect("mongodb://localhost:27017/eInvoice").then(() => {
    //connect to the database if everything is allright.
    serverSelectionTimeoutMS: 50000,
    console.log(`Database connected successfully.`);
}).catch((e) => {
    //catches error during database connection
    console.log(`Database connected successfully`);
});