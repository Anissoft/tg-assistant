import { TgClient } from "../client";
import { Media, Message } from "../types";

const MAX_RETRIES = 10;

export async function processMessage(message: Message, tg: TgClient) {
  if (/instagram\.com\//.test(message.text)) {
    const { video, photos } = await fetchIGMedia(message.text);
    if (video) {
      await tg.sendVideo(message.chat.id, video.blob, video);
    }
    if (photos && photos?.length > 0) {
      await Promise.all(photos.map((photo) => tg.sendPhoto(message.chat.id, photo.blob, photo)));
    }
  }
}

export async function fetchIGMedia(url: string): Promise<{ video?: Media; photos?: Media[]; }> {
  const jobId = await createJob(url);
  const result: { video?: Media; photos?: Media[]; } = {};
  const photoUrls: string[] = [];
  let videoUrl: string | null = null;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const { status, payload } = await getJobStatus(jobId);
    if (status === "working") {
      retries = retries + 1;
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1000);
      });
      continue;
    }
    if (status === "complete") {
      payload.forEach((item) => {
        if (item.type === "video") {
          videoUrl = videoUrl || item.path;
        } else if (item.type === "photo") {
          photoUrls.push(item.path);
        }
      });
      break;
    }
  }

  if (videoUrl) {
    const file = await fetch(videoUrl);

    if (!file.ok) {
      throw new Error(
        `Failed to download media - [${file.status}:${file.statusText}] - ${await file.text()}`
      );
    }

    result.video = {
      blob: await file.blob(),
      width: 1080,
      height: 1920,
    };
  }

  if (photoUrls.length > 0) {
    const files = await Promise.all(photoUrls.map(
      (url) => fetch(url).then((file) => file.blob()).catch(() => false)
    ));
    result.photos = (files.filter(Boolean) as Blob[]).map((blob) => ({ blob }));
  }

  return result;
}

const createJob = async (url: string): Promise<string> => {
  const res = await fetch(`${process.env.IG_URL}/hooks/media`, {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7,be;q=0.6",
      "cache-control": "no-cache",
      "content-type": "application/json;",
      "pragma": "no-cache",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "Referer": process.env.IG_REFERER as string,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    "body": JSON.stringify({ url }),
    "method": "POST",
  });

  if (!res.ok) {
    throw new Error(`Failed to create job - [${res.status}:${res.statusText}] - ${await res.text()}`);
  }

  const { job_id: jobId } = await res.json();

  return jobId;
};

const getJobStatus = async (jobId: string): Promise<{
  status: "working";
  payload: undefined
} | {
  status: "complete";
  payload: {
    "path": string;
    "type": "photo" | "video";
    "name": string | null;
    "caption": string | null;
    "source": string;
    "cors": string | null;
    "width"?: number;
    "height"?: number;
  }[],
}> => {
  const res = await fetch(`${process.env.IG_URL}/api/v1/job_status/${jobId}`, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7,be;q=0.6",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "Referer": process.env.IG_REFERER as string,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    "body": null,
    "method": "GET",
  });

  if (!res.ok) {
    throw new Error(`Failed to get job status - [${res.status}:${res.statusText}] - ${await res.text()}`);
  }

  const { status, payload } = await res.json();

  return { status, payload };
};
