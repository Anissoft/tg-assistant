import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import "./clients/firebase";
import { TgClient } from "./clients/telegram";

import * as rg from "./processors/rg";
import * as ig from "./processors/ig";
import * as commands from "./processors/commands";

import { Message } from "./types";

const HOOK_TOKEN = process.env.HOOK_TOKEN || "";
const API_TOKEN = process.env.API_TOKEN || "";
const ALLOWED_USERS = process.env.ALLOWED_USERS?.split(";") || [];
const tg = new TgClient(API_TOKEN);

export const onMessage = onRequest(async (request, response) => {
  const { message }: { message: Message } = request.body;

  if (!HOOK_TOKEN || !API_TOKEN) {
    response.status(500).send("Incorrect runtime variables");
    return;
  }

  if (
    request.headers["x-telegram-bot-api-secret-token"] !== HOOK_TOKEN ||
    !ALLOWED_USERS.includes(message.from.username)
  ) {
    response.status(403).send("Forbidden");
    return;
  }

  try {
    await Promise.all([
      rg.processMessage(message, tg),
      ig.processMessage(message, tg),
      commands.processMessage(message, tg),
    ]);
  } catch (error) {
    tg.sendMessage(
      message.chat.id,
      (error as Error).message,
    );
    logger.error((error as Error).message);
  }

  response.status(200).send();
});
