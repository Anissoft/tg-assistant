### Instructions

- run `npm install`
- create a firebase project
- login in project folder with `npm run f -- login`
- create a Telegram bot and store it API_KEY in `.env` file
- generate a HOOK_KEY and palce in `.env` file too
- deploy firebase functions with `npm run deploy:functions`
- After deploying your firebase function and obtaining it well-known address - execute next command in terminal:
```
curl -F "url=https://{{ project hostname }}/onMessage" \
  -F "secret_token={{ HOOK_TOKEN }}"\
  -F "allowed_updates=[\"message\", \"message_reaction\"]" \ "https://api.telegram.org/bot{{API_TOKEN}}/setWebhook"
```
