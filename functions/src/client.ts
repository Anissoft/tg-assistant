export class TgClient {
  constructor(private apiKey: string) {}

  public async sendMessage(chatId: string | number, text: string) {
    const result = await fetch(`https://api.telegram.org/bot${this.apiKey}/sendMessage`, {
      method: "POST",
      body: JSON.stringify({ chat_id: chatId, text }),
      headers: {
        "content-type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`Request ${result.url} failed - [${result.status}:${result.statusText}] - ${await result.text()}`);
    }

    return result;
  }

  public async sendVideo(chatId: string | number, video: Blob) {
    const formData = new FormData();

    formData.append("video", video, `${Date.now()}.mp4`);
    formData.append("chat_id", `${chatId}`);
    formData.append("supports_streaming", "true");

    const result = await fetch(`https://api.telegram.org/bot${this.apiKey}/sendVideo`, {
      method: "POST",
      body: formData,
    });

    if (!result.ok) {
      throw new Error(`Request ${result.url} failed - [${result.status}:${result.statusText}] - ${await result.text()}`);
    }

    return result;
  }

  public async sendPhoto(chatId: string | number, photo: Blob) {
    const formData = new FormData();

    formData.append("photo", photo);
    formData.append("chat_id", `${chatId}`);

    const result = await fetch(`https://api.telegram.org/bot${this.apiKey}/sendPhoto`, {
      method: "POST",
      body: formData,
    });

    if (!result.ok) {
      throw new Error(`Request ${result.url} failed - [${result.status}:${result.statusText}] - ${await result.text()}`);
    }

    return result;
  }
}
