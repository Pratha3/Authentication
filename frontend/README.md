Meta Setup (30 minutes, one-time)
Step 1 — Create your Meta App

Go to developers.facebook.com → My Apps → Create App → choose Business

Step 2 — Add WhatsApp

Inside your app → Add Product → WhatsApp → Set Up

Step 3 — Get your credentials

Go to WhatsApp → API Setup. You'll see this page:


Temporary access token:  EAAxxxxxxxxxxxxxxxx   ← META_WHATSAPP_TOKEN
Phone number ID:         1234567890123         ← META_PHONE_NUMBER_ID
Copy both into your .env:


META_WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxxx
META_PHONE_NUMBER_ID=1234567890123
Step 4 — Add a test recipient

On the same page, under "To" → add your phone number → click Send Message. Meta sends a test WhatsApp to verify.

Step 5 — Test your server


# Start backend
cd backend && npm run dev

# Check status
curl http://localhost:5000/api/test/status \
  -H "Authorization: Bearer YOUR_JWT"
Expected:


{
  "whatsapp": {
    "provider": "meta",
    "token": "✅ set",
    "phoneNumId": "✅ set",
    "ready": true
  }
}
Step 6 — Send a test message


curl -X POST http://localhost:5000/api/test/whatsapp \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"to": "+91XXXXXXXXXX"}'
Your phone receives:


✅ Registration Confirmed!
Hi Test User 👋
You're registered for EventSphere Test Event!
🎫 Ticket: TEST1234
...
_EventSphere_
One Important Production Note
The Meta test number (the one they give you in the dashboard) can message any verified recipient. For production with your own registered business number, the first message to a user must use a pre-approved template (Meta reviews these in 2–4 hours). After a user replies, you can send free-form messages for 24 hours.

For an event platform where users are registering and you're confirming their registration, they've already interacted — so the 24h window usually covers your use case. When you go live, submit your confirmation/reminder/cancellation messages as templates so you're fully compliant.