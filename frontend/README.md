Notification Setup

This project does not use Facebook/Meta by default.

Phone numbers collected in signup, profile, and event registration are used for mobile notification channels that are enabled on the backend. In-app notifications always work. SMS works when `SMS_ENABLED=true` and an SMS provider is configured.

Backend defaults:

```env
WHATSAPP_ENABLED=false
SMS_ENABLED=true
SMS_PROVIDER=textbelt
```

To check notification status while developing:

```bash
cd backend
npm run dev
curl http://localhost:5000/api/test/status \
  -H "Authorization: Bearer YOUR_JWT"
```

WhatsApp support is intentionally optional. If you later decide to use Meta Cloud API, set `WHATSAPP_ENABLED=true` and provide `META_WHATSAPP_TOKEN` plus `META_PHONE_NUMBER_ID` in the backend `.env`.
