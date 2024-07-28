const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdraw=require('../models/Withdraw');
const path = require('path');

router.get('/register', (req, res) => {
    if (req.session.user) { // Assuming 'user' is stored in session after login
        res.redirect('/'); // Redirect to the homepage if logged in
    } else {
        res.render('register'); // Render the login.ejs file if not logged in
    }
});

router.post('/register', async (req, res) => {
    const {name,phone,email,password} = req.body;

    const emailPattern = /@gmail\.com$/;
    if (!emailPattern.test(email)) {
        return res.status(400).send({ message: 'Invalid email. Must end with "@gmail.com"' });
    }
    try {
        // Check for existing user with the same email 
        let user = await User.findOne({email});
        if (user) {
            return res.status(400).send('Email already exists');
        }

        // Create a new user with the provided details
        user = new User({ name, phone, email, password });
        await user.save();

        // Set the user session and redirect to home
        req.session.user = user;
        res.redirect('/');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/login', (req, res) => {
    if (req.session.user) { // Assuming 'user' is stored in session after login
        res.redirect('/'); // Redirect to the homepage if logged in
    } else {
        res.render('login'); // Render the login.ejs file if not logged in
    }
});

router.post('/login', async (req, res) => {
    const {email, password } = req.body;
    
    try {
        const user = await User.findOne({ email});
        if (!user) {
            return res.status(400).send('Invalid Email');
        }

        if (user.password !== password) {
            return res.status(400).send('Invalid Password');
        }

        req.session.user = user;
        res.redirect('/');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

router.post('/purchase', (req, res) => {
    if (!req.session.user) { // Assuming 'user' is stored in session after login
        res.redirect('/'); // Redirect to the homepage if logged in
    }
    
    const { plan } = req.body; // The amount selected by the user
    console.log(plan);

    // Define a mapping of amounts to QR code image paths or other details
    const qrCodes = {
        '20': '/images/qrs/qr20.jpg',
        '50': '/images/qrs/qr50.jpg',
        '100': '/images/qrs/qr100.jpg',
        '200': '/images/qrs/qr200.jpg',
        '250': '/images/qrs/qr250.jpg',
        '500': '/images/qrs/qr500.jpg',
        '750': '/images/qrs/qr750.jpg',
        '1000': '/images/qrs/qr1000.jpg',
        '2000': '/images/qrs/qr2000.jpg',
    };

    // Get the corresponding QR code image path for the selected amount
    const qrImage = qrCodes[plan];

    // Check if a valid amount was selected
    if (!qrImage) {
        return res.status(400).send('Invalid plan selected');
    }

    // Render the purchase.ejs file with the QR code image path
    res.render('purchase', { plan, qrImage });
});

router.post('/purchase-request', async (req, res) => {
    const { upiSenderName, transactionDateTime, plan } = req.body;

    try {
        // Parse the transaction date and time
        const date = new Date(transactionDateTime);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
    
        const formattedDateTime = `${formattedHours}:${minutes} ${period} IST, ${day} ${month} ${year}`;
    
        // Convert input and stored names to uppercase for case-insensitive comparison
        const inputName = upiSenderName.trim().toUpperCase();
           
        // Convert plan value to number
        const planAmount = parseInt(plan, 10);
    
        console.log("Formatted DateTime:", formattedDateTime);
        console.log("Input Name:", inputName);
        console.log("Plan Amount:", planAmount);
    
        // Find the transaction with matching details
        let transaction = await Transaction.findOne({
            amount: planAmount,
            time: formattedDateTime
        });
    
    
            if (transaction) {
                console.log("Transaction with amount and time found");
                 
                  // Check if names match
                 if (transaction.name.trim().toUpperCase() === inputName) {
                     console.log("Transaction found with full name.");
                }

               else{
                console.log("FUll Name Not Matched,Checking With First Name");
                const dbFirstName = transaction.name.split(' ')[0].toUpperCase();
                const inputFirstName = inputName.split(' ')[0];
    
                if (dbFirstName !== inputFirstName) {
                    transaction = null; // Names do not match
                    console.log("First name didn't match too");
                }
               }
            } 
            else {
                console.log("No transaction found with amount and time.");
            }
        
        if (!transaction) {
            return res.status(200).json({ success: false, message: 'Transaction not found or details do not match.' });
        }
    
        // Find the player based on the session user (assuming req.session.user contains the logged-in user's details)
        const player = await User.findById(req.session.user._id);
        if (!player) {
            return res.status(400).send('Player not found.');
        }
    
        // Update the player's balance
        player.money += planAmount;
        await player.save();
        await Transaction.deleteOne({ _id: transaction._id });
        res.status(200).json({ success: true,message: 'Transaction verified and balance updated.' });
    } 
    catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});
router.get('/withdraw',(req, res) => {
    // Render the withdrawal page or handle the request as needed
    if (!req.session.user) { // Assuming 'user' is stored in session after login
        res.redirect('/'); // Redirect to the homepage if logged in
    } else {
        res.render('withdraw'); // Render the login.ejs file if not logged in
    }
  });

router.post('/withdraw-request', async (req, res) => {
    try {
        const { upi, amount } = req.body;
        const player = await User.findById(req.session.user._id);

        if (!player) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let m = parseInt(amount, 10);

        if (isNaN(m) || m <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        if (m > player.money) {
            return res.status(200).json({ success: false, message: 'Insufficient Balance' });
        }

        player.money -= m;
        await player.save(); // Save the updated player balance

        const withdraw = new Withdraw({ upi, amount });
        await withdraw.save(); // Save the withdrawal request

        return res.status(200).json({ success: true, message: 'Request Uploaded' });
    } catch (error) {
        console.error('Error processing withdrawal request:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
})

module.exports = router;
