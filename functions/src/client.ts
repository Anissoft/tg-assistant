import type * as Logger from "firebase-functions/logger";

export class TgClient {
  constructor(private apiKey: string, private logger: typeof Logger) {

  }

  public async sendMessage(chatId: string, text: string) {
    return this.request("sendMessage", { chat_id: chatId, text });
  }

  private async request(
    action: string,
    body: Record<string, any>,
    method: RequestInit["method"] = "POST",
  ) {
    try {
      return await fetch(`https://api.telegram.org/bot${this.apiKey}/${action}`, {
        method,
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      });
    } catch (error) {
      this.logger.error((error as Error).message);
      return;
    }
  }
}
