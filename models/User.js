const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://tejasblogger315:XWezmLT2iF31Qc0M@cluster0.y5gmep2.mongodb.net/Gamzy?retryWrites=true&w=majority&appName=Cluster0")



const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true,
        validate: {
            validator: function(v) {
                return /@gmail\.com$/.test(v);
            },
            message: props => `${props.value} is not a valid Gmail address!`
        }
    },
    password: { type: String, required: true }, // No encryption
    money: { type: Number, default: 0 },
    rank: { type: String, default: 'heroic' }
});

module.exports = mongoose.model('player', UserSchema);



//XWezmLT2iF31Qc0M