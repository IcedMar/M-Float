const africasrtalking = require ('africastalking') ({
    apiKey : 'atsk_97270e8ca39e013b05d8c8af76f3c6242ea8ab00e8d6458d57aa7f4738d65d7310d40816',
    username: 'icedmar'
});

const sms = africasrtalking.SMS;
const ussd = africasrtalking.USSD;

module.exports = { sms, ussd };