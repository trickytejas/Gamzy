// server.js
const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const User = require('./models/User');
//transaction email
const bodyParser = require('body-parser');
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const Transaction = require('./models/Transaction');
const app = express();
require('dotenv').config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'));
app.use(bodyParser.json());
// View engine setup
app.set('view engine', 'ejs');

// Session setup
app.use(session({
    secret:process.env.SESSION_SECRET, // Replace with a strong secret key
    resave: false,
    saveUninitialized: true
}));

// Routes
app.use('/auth', authRoutes);

// MongoDB connection
const mongoose = require('mongoose');
//mongoose.connect("mongodb://localhost:27017/Gamer")
mongoose.connect("mongodb+srv://tejasblogger315:XWezmLT2iF31Qc0M@cluster0.y5gmep2.mongodb.net/Gamzy?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => {
        console.log("database connected");
    })
    .catch(err => {
        console.error("Connection error", err);
    });
    
// Define the IMAP configuration
const imapConfig = {
    user: 'tejasagrawal0308@gmail.com',
    password: 'glcmimpqwzbcejyb',
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  };
// Create an IMAP instance with the configuration
const imap = new Imap(imapConfig);


function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  function onReady() {
    console.log('IMAP connection is ready');
  
    openInbox(function(err, box) {
      if (err) {
        console.error('Error opening inbox:', err);
        return;
      }
      //console.log('Mailbox opened:', box);
  
      imap.on('mail', function() {
        console.log('New mail event detected');
  
        // Fetch the most recent email
        imap.search(['ALL'], function(err, results) {
          if (err) {
            console.error('Error searching emails:', err);
            return;
          }
  
          if (results.length > 0) {
            // Get the most recent email
            const latestEmailId = results[results.length - 1];
            //console.log('Most recent email ID:', latestEmailId);
  
            const f = imap.fetch(latestEmailId, { bodies: '' });
  
            f.on('message', function(msg, seqno) {
              //console.log('Processing message number:', seqno);
  
              msg.on('body', function(stream, info) {
                //console.log('Received email body for message:', seqno);
  
                simpleParser(stream, async function(err, mail) {
                  if (err) {
                    console.error('Error parsing email:', err);
                    return;
                  }
  
                  // Extract the sender's email address
                  senderEmail = mail.from.value[0].address;

                  // Check if the sender's email is valid
                  if (senderEmail !== 'no-reply@famapp.in' && senderEmail !== 'tejasblogger315@gmail.com') {
                      console.log('Invalid sender email:', senderEmail);
                      return; // Skip further processing
                  }
  
                  // Print the body of the last email
                  console.log('Email body:', mail.text);
  
                  // Extract transaction details from the email text
                  const nameMatch = mail.text.match(/from\s([A-Z\s]+?)\s+at/i);
                  //console.log("TRANS ID:-"+nameMatch[1]);
                  const amountMatch = mail.text.match( /successfully received ₹(\d+(\.\d{1,2})?)/i);
                  //console.log("Amount:-"+amountMatch);
                  
                  const timeMatch = mail.text.match(/at (\d{2}:\d{2})\s([APM]{2})\sIST,\s(\d{2})\s(\w+)\s(\d{4})/i);
                  //console.log("Time:-"+timeMatch);
                 

                  if (nameMatch && amountMatch && timeMatch) {
                    const name = nameMatch[1].replace(/\s{2,}/g, ' ').trim();
                    const amount = parseFloat(amountMatch[1]);
                    const time = `${timeMatch[1]} ${timeMatch[2]} IST, ${timeMatch[3]} ${timeMatch[4]} ${timeMatch[5]}`;
                    console.log('Extracted transaction details:', { name, amount,time});
  
                    try {
                      const transaction = new Transaction({ name, amount , time});
                      await transaction.save();
                      console.log('Transaction saved successfully');
                    } catch (error) {
                      console.error('Error saving transaction:', error);
                    }
                  } else {
                    console.log('No matching transaction details found in email text.');
                  }
                });
              });
            });
  
            f.once('error', function(err) {
              console.error('Fetch error:', err);
            });
  
            f.once('end', function() {
              console.log('Done fetching the most recent email.');
            });
          } else {
            console.log('No emails found.');
          }
        });
      });
    });
  }

// Function to handle the 'error' event
function onError(err) {
    console.error('IMAP connection error:', err);
}

// Function to handle the 'end' event
function onEnd() {
    console.log('IMAP connection ended');
}

// Attach event handlers
imap.once('ready', onReady);
imap.once('error', onError);
imap.once('end', onEnd);

// Start the IMAP connection
imap.connect();



// Home route
app.get('/', async (req, res) => {
    let user = null;
    if (req.session.user) {
        user = await User.findById(req.session.user._id).exec();  
    }
    res.render('index', { user});
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
