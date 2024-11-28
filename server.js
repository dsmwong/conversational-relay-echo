require('dotenv').config();
const express = require('express');
const ExpressWs = require('express-ws');

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
            console.log(`[Conversation Relay] Message received. This server will echo what you say. You can also interrupt the interrupting a long echo message. DTMF tones are also echod back`);
            switch (message.type) {
                case 'info':
                    console.debug(`[Conversation Relay] info: ${JSON.stringify(message, null, 4)}`)
                    break;
                case 'prompt':
                    console.info(`[Conversation Relay] >>>>>>: ${message.voicePrompt}`);
                    echoResponse = {
                        "type": "text",
                        "token": `You said: ${message.voicePrompt}`,
                        "last": true
                    }
                    console.info(`[Conversation Relay] JSON <<<<<<: ${JSON.stringify(echoResponse, null, 4)}`);
                    // Send the response back to the WebSocket client
                    ws.send(JSON.stringify(echoResponse));
                    break;
                case 'interrupt':
                    // Handle interrupt message
                    console.info(`[Conversation Relay] Interrupt ...... : ${message.utteranceUntilInterrupt}`);
                    break;
                case 'dtmf':
                    // Handle DTMF digits. We are just logging them out for now.
                    console.debug(`[Conversation Relay] DTMF: ${message.digit}`);
                    echoResponse = {
                        "type": "text",
                        "token": `Digit received is: ${message.digit}`,
                        "last": true
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
                    console.info(`[Conversation Relay] Setup <<<<<<: ${JSON.stringify(echoResponse, null, 4)}`);
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

// Basic HTTP endpoint
app.get('/', (req, res) => {
    res.send('WebSocket Server Running');
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
