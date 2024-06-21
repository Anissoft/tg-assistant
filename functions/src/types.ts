export interface Message {
  chat: {
    id: number | string;
  };
  from: {
    username: string;
  }
  text: string;
}
