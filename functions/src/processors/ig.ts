import { TgClient } from "../client";
import { Message } from "../types";

export async function processMessage(message: Message, tg: TgClient) {
  if (/instagram\.com\//.test(message.text)) {
    const { video, photos } = await fetchIGMedia(message.text);
    if (video) {
      await tg.sendVideo(message.chat.id, video);
    }
    if (photos && photos?.length > 0) {
      await Promise.all(photos.map((photo) => tg.sendPhoto(message.chat.id, photo)));
    }
  }
}

export async function fetchIGMedia(url: string): Promise<{ video?: Blob; photos?: Blob[]; }> {
  // const [, , id = ""] = url.match(/instagram.com\/(p|reel)\/([^/]*)(\/|\?|$)/) || [];
  const doc = await fetch(url, { headers: { "accept": "text/html,application/xhtml+xml,application/xml" } });

  if (!doc.ok) {
    throw new Error(
      `Failed to fetch document - [${doc.status}:${doc.statusText}] - ${await doc.text()}`
    );
  }

  const html = await doc.text();

  const [, videoUrl] = html.match(/(https:[^"]*\.mp4[^"]*)/) || [];
  // const [, photoUrl] = html.match(new RegExp(`>(.*"code":"${id}".*)<`)) || [];

  const result: { video?: Blob; photos?: Blob[]; } = { };

  if (videoUrl) {
    const file = await fetch(JSON.parse("\"" + decodeURIComponent(url) + "\""));

    if (!file.ok) {
      throw new Error(
        `Failed to download media - [${file.status}:${file.statusText}] - ${await file.text()}`
      );
    }

    result.video = await file.blob();
  }

  return result;
}
