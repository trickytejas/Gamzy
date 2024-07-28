const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://tejasblogger315:XWezmLT2iF31Qc0M@cluster0.y5gmep2.mongodb.net/Gamzy?retryWrites=true&w=majority&appName=Cluster0")


const WithdrawSchema = new mongoose.Schema({
    upi: { type: String, required: true },
    amount: { type: Number, default: 0 },
});

module.exports = mongoose.model('withdraw', WithdrawSchema);