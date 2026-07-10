import AfricasTalking from "africastalking";

let client: ReturnType<typeof AfricasTalking> | null = null;

function getClient() {
  if (!client) {
    client = AfricasTalking({
      apiKey: process.env.AT_API_KEY!,
      username: process.env.AT_USERNAME!,
    });
  }
  return client;
}

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  cost?: string;
  error?: string;
}

export async function sendSMS(to: string, message: string): Promise<SendSMSResult> {
  try {
    const sms = getClient().SMS;
    const result = await sms.send({
      to: [to],
      message,
      from: process.env.AT_SENDER_ID || "EduBridge",
    });

    const recipient = result?.SMSMessageData?.Recipients?.[0];
    if (!recipient || recipient.status !== "Success") {
      return { success: false, error: recipient?.status ?? "Unknown error" };
    }

    return {
      success: true,
      messageId: recipient.messageId,
      cost: recipient.cost,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMS send failed",
    };
  }
}
