interface FlashFabProps {
  onOpen: () => void;
  /** Offset above bottom nav (px) */
  bottomOffset?: number;
}

export function FlashFab({ onOpen, bottomOffset = 88 }: FlashFabProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open Flash"
      className="fixed z-[35] w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center active:scale-[0.97] touch-manipulation flash-fab-glow"
      style={{
        right: 20,
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M13 2L4.5 12.5H11L10 22L19.5 10.5H13L13 2Z"
          fill="#0B0F19"
          stroke="#0B0F19"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
