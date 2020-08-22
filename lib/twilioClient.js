var twilio = require('twilio');
var VoiceResponse = twilio.twiml.VoiceResponse;
var config = require('../config');
var client = twilio(config.accountSid, config.authToken);

module.exports = {
  createCall: (name, phoneNumber, headersHost, twilioClient = client) => {
    let url = headersHost + '/conversation/1/' + name + '/' + encodeURIComponent(phoneNumber);
    let options = {
        to: phoneNumber,
        from: config.twilioNumber,
        url: url,
        machineDetection: 'DetectMessageEnd',
    };

    return twilioClient.calls.create(options)
      .then((message) => {
        console.log(message.responseText);
        return Promise.resolve('Thank you! We will be calling you shortly.')
      })
      .catch((error) => {
        console.log(error);
        return Promise.reject(error);
      });
  },
  askQuestion: (name, Voice = VoiceResponse) => {
    let twimlResponse = new Voice();

    twimlResponse.say(`Hi ${name} - This is Alice from HelloFresh. ` +
                      `Thanks for visiting our site today. We’d love to offer ` +
                      `you a first time customer discount in exchange for your honest ` +
                      `feedback to a one-question survey. Since visiting our site, have ` +
                      `you purchased a subscription meal service from another company?`,
                      { voice: 'alice' });
    twimlResponse.gather({
      input: 'speech',
      action: '/conversation/2',
      timeout: 5
    });
    return twimlResponse.toString();
  },
  followUpResponse: (isTrue, Voice = VoiceResponse) => {
    let twimlResponse = new Voice();

    if (isTrue) {
      twimlResponse.say(`HelloFresh is the #1 subscription meal service in the US because we have the freshest ingredients and most affordable prices. Use the code RV20 to get 20% off your first order. Expires at the end of this week. You can either purchase online or text or call us at this number to purchase.`,
                        { voice: 'alice' });
    } else {
      twimlResponse.say(`We’re sorry to lose your business. If you change your mind about giving HelloFresh another chance, you can call or text us back at this number to speak with a member of our concierge team who can help you find what you’re looking for, and if you decide to purchase, you can use code RV20 to get 20% off.`,
                        { voice: 'alice' });
    }

    return twimlResponse.toString();
  },
  leaveVoicemail: (name, Voice = VoiceResponse) => {
    let twimlResponse = new Voice();

    twimlResponse.say(`Hi ${name}- this is Alice from Hello Fresh. Just calling to see if I can help you with your purchase decision and offer you a new customer discount. Call me back.`,
                        { voice: 'alice' });

    return twimlResponse.toString();
  },
  sendMessage: (name, phoneNumber) => {
    client.messages
      .create({
        body: `Hi ${name} - This is Alice from HelloFresh. Just missed you. Let me know when is a better time to chat.`,
        from: config.twilioNumber,
        to: phoneNumber
      })
      .then(message => {
        console.log('Sent SMS to ' + message.sid)
      });
  },
}
