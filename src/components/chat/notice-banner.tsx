export function NoticeBanner({ status }: { status: string }) {
  if (status === "closed") {
    return (
      <div className="border-b border-border/60 px-6 py-2.5 text-center text-sm text-red-700">
        이 상담방은 종료되었습니다. 메시지를 확인만 할 수 있습니다.
      </div>
    );
  }

  return (
    <div className="border-b border-border/60 px-6 py-2.5 text-center text-sm text-amber-800">
      상담 일정 조율 및 문의를 위한 채팅입니다. 실제 상담은 진행되지 않습니다.
    </div>
  );
}
