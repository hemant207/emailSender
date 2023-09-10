require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs'); 
const nodemailer = require("nodemailer");
const { error } = require('console');
const path = require('path');
const async = require('async');

const transporter = nodemailer.createTransport({
  service: "outlook",
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: process.env.user_email,
    pass: process.env.password
  }
});

// async..await is not allowed in global scope, must use a wrapper
async function main(client_address,text_msg,text_subject) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.user_email , // sender address
    to: client_address, // list of receivers
    subject: text_subject, // Subject line
    text: text_msg, // plain text body
    html: `<b>${text_msg}</b>`, // html body
  });

  console.log("Message sent: %s", info.messageId);

  return info.messageId;

  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  //
  // NOTE: You can go to https://forwardemail.net/my-account/emails to see your email delivery status and preview
  //       Or you can use the "preview-email" npm package to preview emails locally in browsers and iOS Simulator
  //       <https://github.com/forwardemail/preview-email>
  //
}

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files from the "public" directory
const rootDir = path.join(__dirname, 'public'); // Replace 'public' with your actual directory name

app.use(express.static(rootDir));


// Your other routes and server setup here
app.get('/',(req,res)=>{
    const filePath = path.join(rootDir, 'index.html'); // Replace 'index.html' with your actual file name
    res.sendFile(filePath);
})

app.get('/sendmsg',(req,res)=>{
    const filePath = path.join(rootDir, 'msg.html'); // Replace 'index.html' with your actual file name
    res.sendFile(filePath);
})

app.get('/client',(req,res)=>{
    const filePath = path.join(rootDir, 'client.html'); // Replace 'index.html' with your actual file name
    res.sendFile(filePath);
})
const jsonFilePath = 'userdata.json';

app.get('/getallclient', (req, res) => {
    // Read the JSON file and parse its contents
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            res.status(500).send({ error: 'Unable to read JSON file' });
        } else {
            try {
                const clients = JSON.parse(data);
                res.json(clients);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                res.status(500).send({ error: 'Error parsing JSON data' });
            }
        }
    });
});
app.post('/submit', (req, res) => {
    const username = req.body.username;
    const email = req.body.email;

    // Save the data to a database or a file, or perform any desired action
    // For example, you can store it in an array for demonstration purposes:
    const userData = {
        username,
        email,
    };

    let existingData = [];
    try {
        existingData = JSON.parse(fs.readFileSync('userdata.json'));
    } catch (error) {
        // Handle errors (e.g., file not found)
    }

    // Append the new user data to the existing data
    existingData.push(userData);

    // Write the updated data back to the JSON file
    fs.writeFileSync('userdata.json', JSON.stringify(existingData, null, 2));

    console.log('User Data:', userData);

    res.send({'User Data:': userData})
})

const emailQueue = async.queue((taskData, callback) => {
    const { client_address , text_msg, text_subject } = taskData;
    main(client_address, text_msg, text_subject,(error, result) => {
        if (error) {
            console.error('Error in email task:', error);
        } else {
            console.log('Email status:', result.status, 'for', result.email);
        }
        callback(); // Call the callback without error to signal completion
    });
}, 1);

app.post('/submitselectedclients',async (req,res)=>{
    console.log(req.body);
    const data_email =req.body.selectedEmails || [];
    const text_msg = req.body.text_msg;
    const text_subject = req.body.text_subject;

    console.log(data_email , text_msg , text_subject );

    try {
        data_email.forEach((client_address) => {
            emailQueue.push({client_address, text_msg, text_subject});
        });
        res.send({ "message": "Emails sent successfully", "clients": data_email });
    } catch (error) {
        console.error(error);
        res.status(500).send({ "message": "Email sending failed" });
    }
})

app.post('/sendmail',async (req,res)=>{
    const text_subject = req.body.text_subject;
    const text_msg = req.body.text_msg;
    const client_address = req.body.client_address;

    const rply = await main(client_address,text_msg,text_subject);
    console.log(rply);

    res.send({message:rply});
})
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


"use strict";

//main().catch(console.error);
