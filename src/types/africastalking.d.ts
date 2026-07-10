declare module "africastalking" {
  interface SMSRecipient {
    number: string;
    cost: string;
    status: string;
    statusCode: number;
    messageId: string;
  }

  interface SMSSendResponse {
    SMSMessageData: {
      Message: string;
      Recipients: SMSRecipient[];
    };
  }

  interface SMSSendOptions {
    to: string[];
    message: string;
    from?: string;
  }

  interface AfricasTalkingSMS {
    send(options: SMSSendOptions): Promise<SMSSendResponse>;
  }

  interface AfricasTalkingClient {
    SMS: AfricasTalkingSMS;
  }

  export default function AfricasTalking(options: {
    apiKey: string;
    username: string;
  }): AfricasTalkingClient;
}
