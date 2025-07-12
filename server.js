require('dotenv').config();
const express = require('express');
const ExpressWs = require('express-ws');
const twilio = require('twilio');

const app = express();
const PORT = 4000;
// Extract all the .env variables here

// Initialize express-ws
ExpressWs(app);

// 
// WebSocket endpoint
//
app.ws('/conversation-relay', async (ws) => {
    console.log('New Conversation Relay websocket established');

    // Handle incoming messages
    ws.on('message', async (data) => {
        let echoResponse = "";
        try {
            const message = JSON.parse(data);
            console.log(`[Conversation Relay] Message received. JSON >>>>>>: ${JSON.stringify(message, null, 2)}`);
            switch (message.type) {
                case 'info':
                    console.debug(`[Conversation Relay] info: ${JSON.stringify(message, null, 2)}`)
                    break;
                case 'prompt':
                    console.info(`[Conversation Relay] >>>>>>: ${message.voicePrompt}`);
                    if( message.voicePrompt.toLowerCase().includes('transfer to an agent') ) {
                        // If the message contains a voice prompt, we will echo it back
                        const handoffData = {
                            "reason": "transfer",
                            "code": "200",
                            "data": {
                                "callSid": message.callSid,
                                "from": message.from,
                                "to": message.to,
                                "lastVoicePrompt": message.voicePrompt
                            }
                        }
                        echoResponse = {
                            "type": "end",
                            "handoffData": JSON.stringify(handoffData)
                        }
                    } else {
                        echoResponse = {
                            "type": "text",
                            "token": `You said: ${message.voicePrompt}`,
                            "last": true
                        }
                    }
                    console.info(`[Conversation Relay] JSON <<<<<<: ${JSON.stringify(echoResponse, null, 2)}`);
                    // Send the response back to the WebSocket client
                    ws.send(JSON.stringify(echoResponse));
                    break;
                case 'interrupt':
                    // Handle interrupt message
                    console.info(`[Conversation Relay] Interrupt ...... : ${JSON.stringify(message, null, 2)}`);
                    break;
                case 'dtmf':
                    // Handle DTMF digits. We are just logging them out for now.
                    console.debug(`[Conversation Relay] DTMF: ${message.digit}`);
                    echoResponse = {
                        "type": "text",
                        "token": `Digit received is: ${message.digit}. DTMF tones are also echoed back as `,
                        "last": true
                    }
                    // Send the response back to the WebSocket client
                    ws.send(JSON.stringify(echoResponse));
                    echoResponse = {
                        "type": "sendDigits",
                        "digits": `${message.digit}`,
                    }
                    // Send the response back to the WebSocket client
                    ws.send(JSON.stringify(echoResponse));
                    break;
                case 'setup':
                    // Log out the Setup Message to and from phone numbers
                    console.log(`[Conversation Relay] Setup message. Call from: ${message.from} to: ${message.to} with call SID: ${message.callSid}`);
                    echoResponse = {
                        "type": "text",
                        "token": `Initial Setup Message received`,
                        "last": true
                    }
                    console.info(`[Conversation Relay] Setup <<<<<<: ${JSON.stringify(echoResponse, null, 2)}`);
                    // Send the response back to the WebSocket client
                    ws.send(JSON.stringify(echoResponse));
                    break;
                default:
                    console.log(`[Conversation Relay] Unknown message type: ${message.type}`);
            };
        } catch (error) {
            console.error('[Conversation Relay] Error in message handling:', error);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

////////// SERVER BASICS //////////
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic HTTP endpoint
app.get('/', (req, res) => {
    res.send('WebSocket Server Running');
});

app.post('/twiml/incoming-call', (req, res) => {
    // This endpoint can be used to handle incoming TwiML requests
    res.type('text/xml');
    const twiml = new twilio.twiml.VoiceResponse();
    const connect = twiml.connect({
        action: `https://${process.env.HOSTNAME}/twiml/wrap-up`
    });
    const parameters = req.body;
    console.log(`[Conversation Relay] Incoming call parameters: ${JSON.stringify(req.body, null, 2)}`);
    const conversationRelay = connect.conversationRelay({
        url: `wss://${process.env.HOSTNAME}/conversation-relay`,
        ...parameters,
    })

    res.send(twiml.toString());
});

app.post('/twiml/wrap-up', (req, res) => {
    // This endpoint can be used to handle wrap-up after the conversation
    res.type('text/xml');
    console.log(`[Conversation Relay] Wrap-up parameters: ${JSON.stringify(req.body, null, 2)}`);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Thank you for using the Conversation Relay service. Goodbye!');
    res.send(twiml.toString());
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    } else {
        console.error('Failed to start server:', error);
    }
    process.exit(1);
});
