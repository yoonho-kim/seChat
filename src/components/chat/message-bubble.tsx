import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/use-realtime-messages";

const roleLabels: Record<string, string> = {
  counselor: "상담사",
  client: "내담자",
  admin: "관리자",
};

const roleDotColors: Record<string, string> = {
  counselor: "bg-primary",
  client: "bg-emerald-500",
  admin: "bg-amber-500",
};

export function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  // 시스템 메시지 (입장/퇴장 등)
  if (message.sender_role === "system") {
    return (
      <div className="self-center py-1">
        <span className="text-[12px] text-muted-foreground/90">
          {message.content}
        </span>
      </div>
    );
  }

  const createdAt = new Date(message.created_at).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className={cn("w-full max-w-[82%] py-0.5", isOwn ? "ml-auto text-right" : "mr-auto text-left")}>
      <p
        className={cn(
          "m-0 flex flex-wrap items-center gap-x-2 text-[12px] text-muted-foreground",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            roleDotColors[message.sender_role] || "bg-muted-foreground"
          )}
        />
        <span className={cn("font-medium", isOwn ? "text-primary" : "text-foreground/75")}>
          {message.sender_name}
        </span>
        <span>{roleLabels[message.sender_role] || message.sender_role}</span>
        <span>{createdAt}</span>
      </p>
      <p
        className={cn(
          "m-0 mt-1 whitespace-pre-wrap break-words text-[0.98rem] leading-[1.82] tracking-[-0.01em]",
          isOwn ? "text-foreground" : "text-foreground/88"
        )}
      >
        {message.content}
      </p>
    </article>
  );
}
