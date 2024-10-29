# Simple Conversation Relay

This project consists of a simple WebSocket server for handling conversation relay requests. It does not use any LLM or backend components and is intended for testing purposes only. It simply logs and echo's messages received for the various stages of Conversation Relay.

## Prerequisites

- Node.js v18
- pnpm
- ngrok
## Project Structure

```
.
├── server/          # WebSocket server for conversation relay
```

## Server Component

The server handles WebSocket connections and manages Conversation Relay functionality.

### Running the Server


1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

4. Expose the server using ngrok:
```bash
ngrok http --domain server-xxxx.ngrok.dev 4000
```

## Twilio Configuration

### TwiML Bin Setup

1. Create a new TwiML Bin in your Twilio console
2. Add the following TwiML code:
```xml
<Response>
   <Connect>
      <ConversationRelay url="wss://server-xxxx.ngrok.dev/conversation-relay" voice="en-AU-Neural2-A" dtmfDetection="true" interruptByDtmf="true" debug="true"/>
   </Connect>
</Response>
```
3. Configure your Twilio phone number to use this TwiML Bin for incoming voice calls

### WebSocket Connection Flow

1. When a call is received, Twilio initiates a WebSocket connection to `wss://server-xxxx.ngrok.dev/conversation-relay`
2. This triggers the "setup" message echo from the server
3. all subsequent messaages are just logged in the console and echoed back to the client

## Dependencies
- express
- express-ws
- dotenv
