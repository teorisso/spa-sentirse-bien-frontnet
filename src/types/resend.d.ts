declare module 'resend' {
  export class Resend {
    constructor(apiKey?: string);
    emails: {
      send(payload: {
        from: string;
        to: string | string[];
        subject: string;
        html: string;
        reply_to?: string;
      }): Promise<any>;
    };
  }
} 