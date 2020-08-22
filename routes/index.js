const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const twilioClient = require('../lib/twilioClient');

module.exports = function(app) {
    // Set Pug as the default template engine
    app.set('view engine', 'pug');

    // Express static file middleware - serves up JS, CSS, and images from the
    // "public" directory where we started our webapp process
    app.use(express.static(path.join(process.cwd(), 'public')));

    // Parse incoming request bodies as form-encoded
    app.use(bodyParser.json({}));
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // Use morgan for HTTP request logging
    app.use(morgan('combined'));

    // Home Page with Click to Call
    app.get('/', function(request, response) {
      response.render('index');
    });

    // Handle an AJAX POST request to place an outbound call
    app.post('/call', async function(req, response) {
      let name = (req.body.name || '').split(' ')[0];
      let phoneNumber = req.body.phoneNumber;

      console.log(`Waiting 30 seconds to make call to ${name} at ${phoneNumber}`)
      // wait 30 seconds
      await new Promise(resolve => setTimeout(resolve, 30000));

      console.log('Calling...');

      // This should be the publicly accessible URL for your application
      // Here, we just use the host for the application making the req,
      // but you can hard code it or use something different if need be
      // For local development purposes remember to use ngrok and replace the headerHost
      let headersHost = 'http://' + req.headers.host;
      try {
        const result = await twilioClient.createCall(name, phoneNumber, headersHost)
        response.send({message: result});
      } catch (error) {
        response.status(500).send(error);
      }
    });

    // Return TwiML instructions for the outbound call
    app.post('/conversation/1/:name/:number', async function(req, res) {
      let isMachine = req.body['AnsweredBy'] === 'machine_end_beep';
      let name = req.params.name;
      let number = req.params.number;

      console.log('Step one webhook recieved.', name, number)

      if (isMachine) {
        console.log('Initiating voicemail response.')
        let result = twilioClient.leaveVoicemail(name);
        res.send(result);
        console.log('Sending SMS.')
        twilioClient.sendMessage(name, number)
      } else {
        console.log('Sending followup question.')
        let result = twilioClient.askQuestion(name);
        res.send(result);
      }
    });

    app.post('/conversation/2', async function(req, res) {
      console.log('Step two webhook recieved.')

      let speechResult = req.body['SpeechResult'] || '';
      speechResult = speechResult.toLowerCase();
      let isTrue = speechResult.indexOf('yea') >= 0 || speechResult.indexOf('yes') >= 0;
      console.log(`Detected speech is ${isTrue ? 'true' : 'false'}`);
      console.log(speechResult);
      let result = twilioClient.followUpResponse(isTrue);
      res.send(result);
    });
};
