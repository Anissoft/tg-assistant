import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import { TgClient } from "./client";

const HOOK_TOKEN = process.env.HOOK_TOKEN || "";
const API_TOKEN = process.env.API_TOKEN || "";
const client = new TgClient(API_TOKEN, logger);

export const onMessage = onRequest((request, response) => {
  if (!HOOK_TOKEN || !API_TOKEN) {
    response.status(500).send("Incorrect runtime variables");
    return;
  }
  if (request.headers["x-telegram-bot-api-secret-token"] !== HOOK_TOKEN) {
    response.status(403).send("Forbidden");
    return;
  }

  const { message } = request.body;
  logger.info(JSON.stringify(message));

  client.sendMessage(message.chat.id, message.text.toUpperCase());

  response.status(200).send();
});
