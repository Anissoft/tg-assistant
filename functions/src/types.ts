export interface Message {
  message_id: string;
  chat: {
    id: number | string;
  };
  from: {
    username: string;
  }
  text: string;
}


export interface Media {
  blob: Blob;
  height?: number;
  width?: number;
  caption?: string;
}
