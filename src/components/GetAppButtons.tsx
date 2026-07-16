import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  getMobilePlatform,
  hasAppStoreLink,
  isNativeApp,
} from "@/lib/appStores";

// Both marks are drawn in currentColor: two flat monochrome logos read as one
// set against the hard-shadowed buttons, and they stay legible in dark mode.
function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function PlayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
    </svg>
  );
}

type Size = "sm" | "md";

const SIZES: Record<Size, { pad: string; mark: string; eyebrow: string; name: string }> = {
  sm: { pad: "px-3 py-2 gap-2.5", mark: "h-5 w-5", eyebrow: "text-[9px]", name: "text-[13px]" },
  md: { pad: "px-5 py-3 gap-3", mark: "h-7 w-7", eyebrow: "text-[10px]", name: "text-base" },
};

function StoreLink({
  href,
  eyebrow,
  name,
  size,
  children,
}: {
  href: string;
  eyebrow: string;
  name: string;
  size: Size;
  children: React.ReactNode;
}) {
  const s = SIZES[size];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${eyebrow} ${name}`}
      className={`neo-brutal-btn rounded-xl bg-background text-foreground inline-flex items-center ${s.pad} min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
    >
      {children}
      <span className="text-left leading-none">
        <span className={`block ${s.eyebrow} font-bold uppercase tracking-[0.14em] text-muted-foreground`}>
          {eyebrow}
        </span>
        <span className={`block ${s.name} font-black tracking-tight mt-0.5`}>{name}</span>
      </span>
    </a>
  );
}

interface GetAppButtonsProps {
  size?: Size;
  /** "col" stacks them — use in narrow containers like the sidebar. */
  orientation?: "row" | "col";
  className?: string;
}

/**
 * Store buttons for the mobile app. Renders nothing inside the native app
 * (you're already there) or when a store link isn't configured yet.
 */
export function GetAppButtons({
  size = "md",
  orientation = "row",
  className = "",
}: GetAppButtonsProps) {
  if (isNativeApp()) return null;

  const s = SIZES[size];

  const ios = hasAppStoreLink ? (
    <StoreLink key="ios" href={APP_STORE_URL} eyebrow="Download on the" name="App Store" size={size}>
      <AppleMark className={s.mark} />
    </StoreLink>
  ) : null;

  const android = (
    <StoreLink key="android" href={PLAY_STORE_URL} eyebrow="Get it on" name="Google Play" size={size}>
      <PlayMark className={s.mark} />
    </StoreLink>
  );

  // Lead with the store the visitor's device can actually install from.
  const buttons = getMobilePlatform() === "android" ? [android, ios] : [ios, android];

  return (
    <div
      className={`flex ${orientation === "col" ? "flex-col" : "flex-col sm:flex-row"} gap-3 ${className}`}
    >
      {buttons}
    </div>
  );
}
