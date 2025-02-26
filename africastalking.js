const africasrtalking = require ('africastalking') ({
   apikey : process.env.AT_API_KEY,
   username: process.env.AT_USERNAME
});

const sms = africasrtalking.SMS;
const ussd = africasrtalking.USSD;

module.exports = { sms, ussd };
