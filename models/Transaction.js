const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://tejasblogger315:XWezmLT2iF31Qc0M@cluster0.y5gmep2.mongodb.net/Gamzy?retryWrites=true&w=majority&appName=Cluster0")


const transactionSchema = new mongoose.Schema({
  name: String,
  amount: Number,
  time:String,
});

module.exports = mongoose.model('transaction', transactionSchema);
