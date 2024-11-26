
import * as admin from "firebase-admin";
import { TgClient } from "../clients/telegram";
import { Message } from "../types";

export async function processMessage(message: Message, tg: TgClient) {
  if (!/^\/(add|list|remove)/.test(message.text)) {
    return;
  }

  try {
    const path = `/list/${message.chat.id}/`;
    const db = admin.database().ref(path);
    let list: null | string = await (await db.get()).val();

    if (list === null) {
      await db.set("");
      list = "";
    }

    const item = message.text
      .replace(/@\S+/, "")
      .replace(/\/(add|remove)\s*/, "")
      .replace(/(^;|;$)/gmi, "")
      .toLowerCase()
      .trim();

    if (message.text.startsWith("/add")) {
      if (!item) {
        await tg.sendMessage(message.chat.id, "Please specify item to add (eg. /add milk)");
      } else {
        await db.set(list ? `${list};${item}` : item);
        await tg.sendMessage(
          message.chat.id,
          `Added "${item.split(";").join("\",\"")}" to the /list`
        );
        await tg.deleteMessage(message.chat.id, message.message_id);
      }
    }

    if (message.text.startsWith("/list")) {
      if (list === "") {
        await tg.sendMessage(message.chat.id, "/list is empty");
      } else {
        const formattedList = list.split(";").map((item) => `- ${item}\n`);
        await tg.sendMessage(
          message.chat.id,
          `/list currently contains ${formattedList.length} items:\n${formattedList.join("")}`
        );
      }
      await tg.deleteMessage(message.chat.id, message.message_id);
    }

    if (message.text.startsWith("/remove")) {
      if (!item) {
        await tg.sendMessage(message.chat.id, "Please specify item to remove (eg. /remove eggs)");
      } else {
        await db.set(list.split(";").filter((candidate) => candidate !== item).join(";"));
        await tg.sendMessage(
          message.chat.id,
          `Removed "${item.split(";").join("\",\"")}" from the /list`
        );
        await tg.deleteMessage(message.chat.id, message.message_id);
      }
    }
  } catch (error) {
    console.error((error as Error).message);
    await tg.sendMessage(message.chat.id, (error as Error).message);
  }
}
