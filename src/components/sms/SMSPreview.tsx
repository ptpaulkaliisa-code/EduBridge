import { SMS_CHARACTER_LIMIT } from "@/lib/utils/constants";

export function SMSPreview({ message }: { message: string }) {
  const overLimit = message.length > SMS_CHARACTER_LIMIT;
  return (
    <div className="rounded-lg border border-[#D9E8E2] bg-[#F1F6F4] p-3">
      <p className="whitespace-pre-wrap text-sm text-[#172B36]">{message}</p>
      <p className={`mt-1 text-xs ${overLimit ? "text-red-600" : "text-[#3A5A66]"}`}>
        {message.length}/{SMS_CHARACTER_LIMIT} characters
        {overLimit ? " — will send as multiple SMS segments" : ""}
      </p>
    </div>
  );
}
