const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { db } = require('./firebase');
const { sms } = require('./africastalking');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Server is up and running.');
});

app.post('/ussd', async (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;
    if (!text) {
        return res.set('Content-Type', 'text/plain').send('END Invalid USSD request: missing text property.');
    }

    let response = '';
    const userResponse = text.split('*');
    try {
        switch (userResponse.length) {
            case 1:
                response = `CON Welcome to M-Float Service.\n1. Register\n2. My Wallet\n3. Help Line`;
                break;
            case 2:
                if (userResponse[0] === '1') {
                    response = `CON Accept the Terms & Conditions:\n1. Accept\n2. Decline\n#. Home`;
                } else if (userResponse[0] === '2') {
                    response = `CON Enter Store Number:`;
                } else if (userResponse[0] === '3') {
                    response = `END Contact our Team: 0717801212`;
                }
                break;
            case 3:
                if (userResponse[0] === '1' && userResponse[1] === '1') {
                    response = `CON Enter referral code:`;
                } else if (userResponse[0] === '1' && userResponse[1] === '2') {
                    response = `END You have declined the Terms and Conditions.`;
                } else if (userResponse[0] === '2') {
                    const storeNumber = userResponse[2];
                    const userDoc = await db.collection('users').doc(phoneNumber).get();
                    if (userDoc.exists && userDoc.data().storeNumber === storeNumber) {
                        response = `CON Enter your PIN:`;
                    } else {
                        response = `END Invalid Store Number.`;
                    }
                }
                break;
            case 4:
                if (userResponse[0] === '1' && userResponse[1] === '1') {
                    const referralCode = userResponse[2];
                    const agentDoc = await db.collection('agents').doc(referralCode).get();
                    if (agentDoc.exists) {
                        response = `CON Referred by: ${agentDoc.data().name}\nEnter M-Pesa Number:`;
                    } else {
                        response = `END Invalid referral code!`;
                    }
                } else if (userResponse[0] === '2') {
                    response = `CON Enter Amount to Purchase Float:`;
                }
                break;
            case 5:
                if (userResponse[0] === '1' && userResponse[1] === '1') {
                    response = `CON Enter ID Number:`;
                } else if (userResponse[0] === '2') {
                    const userDoc = await db.collection('users').doc(phoneNumber).get();
                    response = `END Your Wallet Balance is: Ksh. ${userDoc.data().walletBalance}`;
                } else if (userResponse[0] === '2' && userResponse[3] === '3') {
                    await sendTransactionStatement(phoneNumber);
                    response = `END Transaction statements sent via SMS.`;
                }
                break;
            case 6:
                if (userResponse[0] === '1' && userResponse[1] === '1') {
                    response = `CON Enter Store Number:`;
                }
                break;
            case 7:
                if (userResponse[0] === '1' && userResponse[1] === '1') {
                    response = `CON Create New 4-digit PIN:`;
                }
                break;
            case 8:
                if (userResponse[0] === '1' && userResponse[1] === '1') {
                    response = `CON Confirm PIN:`;
                }
                break;
            case 9:
                if (userResponse[0] === '1' && userResponse[1] === '1') {
                    const pin = userResponse[7];
                    const confirmPin = userResponse[8];
                    if (pin === confirmPin) {
                        try {
                            const mpesaNumber = userResponse[3];
                            const idNumber = userResponse[4];
                            const storeNumber = userResponse[5];
                            await db.collection('users').doc(phoneNumber).set({
                                idNumber, storeNumber, secretPin: pin, walletBalance: 0
                            });
                            await sendSmsConfirmation(phoneNumber, 'Welcome to M-Float, Registration Successful.');
                            response = `END Registration Successful. Transaction cost Kes. 0.00.`;
                        } catch (error) {
                            response = `END Registration Failed: ${error.message}`;
                        }
                    } else {
                        response = `END PINs do not match. Please try again!`;
                    }
                }
                break;
            default:
                response = `END Invalid Option.`;
                break;
        }
        res.set('Content-Type', 'text/plain').send(response);
    } catch (error) {
        res.set('Content-Type', 'text/plain').send(`END An error occurred: ${error.message}`);
    }
});

const sendSmsConfirmation = async (phoneNumber, message) => {
    try {
        await sms.send({ to: phoneNumber, message });
    } catch (error) {
        console.error('Error Sending Message:', error);
    }
};

const sendTransactionStatement = async (phoneNumber) => {
    try {
        const statement = 'Your transaction statements for the past 3 months are: ...';
        await sms.send({ to: phoneNumber, message: statement });
    } catch (error) {
        console.error('Error sending statements:', error);
    }
};

app.listen(3000, () => {
    console.log('USSD app running on port 3000');
});
