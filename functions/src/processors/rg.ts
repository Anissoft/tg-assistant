import { TgClient } from "../clients/telegram";
import { Media, Message } from "../types";

type GIF = {
  urls: Record<"hd" | "sd" | "thumbnail", string>;
  gallery: string | null;
  duration: number | null;
  type: 1 | 2;
  width: number;
  height: number;
};

export async function processMessage(message: Message, tg: TgClient) {
  if (!/redgifs\.com\/(watch|ifr)/.test(message.text)) {
    return;
  }

  try {
    const { video, photos } = await fetchRGMedia(message.text);
    if (video) {
      await tg.sendVideo(message.chat.id, video.blob, video);
    }
    if (photos && photos?.length > 0) {
      await Promise.all(photos.map((photo) => tg.sendPhoto(message.chat.id, photo.blob, photo)));
    }
    await tg.deleteMessage(message.chat.id, message.message_id);
  } catch (error) {
    await tg.sendMessage(message.chat.id, (error as Error).message);
  }
}

export async function authRG() {
  const res = await fetch("https://api.redgifs.com/v2/auth/temporary");

  if (!res.ok) {
    throw new Error(
      `RG Authorization failed - [${res.status}:${res.statusText}] - ${await res.text()}`
    );
  }

  const { token /* , addr, agent, session  */ } = await res.json();
  return token as string;
}

export async function fetchRGMedia(url: string): Promise<{
  video?: Media;
  photos?: Media[];
}> {
  const [, , id] = url.match(/(watch|ifr)\/([a-z0-9]*)(#|\?|\/|$)/) || [];

  if (!id) {
    throw new Error("Unable to extract RG id");
  }

  const token = await authRG();
  const res = await fetch(`https://api.redgifs.com/v2/gifs/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch gif info - [${res.status}:${res.statusText}] - ${await res.text()}`
    );
  }

  const { gif } = await res.json() as { gif: GIF };

  if (gif.gallery) {
    const gallery = await fetch(`https://api.redgifs.com/v2/gallery/${gif.gallery}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!gallery.ok) {
      throw new Error(
        `Failed to fetch gallery - [${gallery.status}:${gallery.statusText}] - ${await gallery.text()}`
      );
    }

    const { gifs } = await gallery.json() as { gifs: GIF[] };
    const files = await Promise.all(
      gifs.map(
        (item) => fetch(item.urls.hd).then((file) => file.blob()).catch(() => false)
      )
    );
    return { photos: (files.filter(Boolean) as Blob[]).map((blob) => ({ blob })) };
  } else {
    const head = await fetch(gif.urls.hd, { method: "HEAD" });
    const file = await fetch(
      head.ok && Number(head.headers.get("content-length")) / 1000000 > 50 ?
        gif.urls.sd :
        gif.urls.hd
    );

    if (!file.ok) {
      throw new Error(
        `Failed to download media - [${file.status}:${file.statusText}] - ${await file.text()}`
      );
    }

    switch (gif.type) {
    case 2:
      return {
        photos: [{
          blob: await file.blob(),
          width: gif.width,
          height: gif.height,
        }],
      };
    case 1:
    default:
      return {
        video: {
          blob: await file.blob(),
          width: gif.width,
          height: gif.height,
        },
      };
    }
  }
}
