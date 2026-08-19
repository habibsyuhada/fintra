import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement>

function base(paths: React.ReactNode) {
  return function Icon({ className, ...props }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ?? 'h-5 w-5'}
        {...props}
      >
        {paths}
      </svg>
    )
  }
}

export const HomeIcon = base(
  <path d="M3 11.5 12 4l9 7.5M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9" />,
)

export const ReceiptListIcon = base(
  <>
    <path d="M6 3h12a1 1 0 0 1 1 1v16l-2.5-1.5L14 20l-2-1.5L10 20l-2.5-1.5L5 20V4a1 1 0 0 1 1-1Z" />
    <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" />
  </>,
)

export const CameraIcon = base(
  <>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z" />
    <circle cx="12" cy="13" r="3.25" />
  </>,
)

export const RepeatIcon = base(
  <>
    <path d="M4 7h12a3 3 0 0 1 3 3v1" />
    <path d="m16 4 3 3-3 3" />
    <path d="M20 17H8a3 3 0 0 1-3-3v-1" />
    <path d="m8 20-3-3 3-3" />
  </>,
)

export const PiggyIcon = base(
  <>
    <path d="M4.5 12a5.5 5.5 0 0 1 5.5-5.5h4A5.5 5.5 0 0 1 19 11.2l1.5.6-1 2-1.5-.3v2.1a1 1 0 0 1-1 1H15v2h-2v-2h-2.5a5.5 5.5 0 0 1-4.9-3H4v-2h1.4A5.5 5.5 0 0 1 4.5 12Z" />
    <circle cx="15.25" cy="10.75" r=".75" fill="currentColor" stroke="none" />
    <path d="M9 6.5V5a1 1 0 0 1 1.7-.7l1 1" />
  </>,
)

export const ChartPieIcon = base(
  <>
    <path d="M12 3a9 9 0 1 0 9 9h-9Z" />
    <path d="M15 4.5A9 9 0 0 1 19.5 9H15Z" />
  </>,
)

export const WalletIcon = base(
  <>
    <path d="M3.5 7A2.5 2.5 0 0 1 6 4.5h11A1.5 1.5 0 0 1 18.5 6v1" />
    <rect x="3.5" y="7" width="17" height="12.5" rx="2" />
    <path d="M15.5 13.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" fill="currentColor" stroke="none" />
  </>,
)

export const TagIcon = base(
  <>
    <path d="M11.5 4H6a1 1 0 0 0-1 1v5.5a1 1 0 0 0 .3.7l8.5 8.5a1 1 0 0 0 1.4 0l5.5-5.5a1 1 0 0 0 0-1.4l-8.5-8.5a1 1 0 0 0-.7-.3Z" />
    <circle cx="8.75" cy="8.75" r="1.25" />
  </>,
)

export const LogoutIcon = base(
  <>
    <path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
    <path d="M9 12h11m0 0-3-3m3 3-3 3" />
  </>,
)

export const MenuIcon = base(<path d="M4 6h16M4 12h16M4 18h16" />)
export const CloseIcon = base(<path d="M6 6l12 12M6 18 18 6" />)
export const PlusIcon = base(<path d="M12 5v14M5 12h14" />)
export const ArrowsRightLeftIcon = base(
  <>
    <path d="M4 7h13m0 0-3.5-3.5M17 7l-3.5 3.5" />
    <path d="M20 17H7m0 0 3.5-3.5M7 17l3.5 3.5" />
  </>,
)
export const DownloadIcon = base(
  <>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
    <path d="M5 18.5h14" />
  </>,
)
export const TrashIcon = base(
  <>
    <path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.7 12.1a2 2 0 0 1-2 1.9H9.7a2 2 0 0 1-2-1.9L7 7" />
    <path d="M10 11v6M14 11v6" />
  </>,
)
export const PencilIcon = base(
  <path d="m16.5 3.5 4 4L8 20H4v-4L16.5 3.5Z" />,
)
export const EyeIcon = base(
  <>
    <path d="M2.5 12S5.8 5.5 12 5.5 21.5 12 21.5 12 18.2 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
)
export const EyeOffIcon = base(
  <>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.6A10.6 10.6 0 0 1 12 5.5c6.2 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.24 4.06M6.5 6.86C4 8.53 2.5 12 2.5 12s3.3 6.5 9.5 6.5c1.34 0 2.55-.3 3.6-.77M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </>,
)
export const CheckCircleIcon = base(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.5 2.3 2.3 4.7-5" />
  </>,
)
export const WifiOffIcon = base(
  <>
    <path d="M3 8.5A17 17 0 0 1 8 6M16 6a17 17 0 0 1 5 2.5M6 12a12 12 0 0 1 3.3-1.9M14.7 10.1A12 12 0 0 1 18 12M9 15.5a5 5 0 0 1 6 0" />
    <path d="M12 19v.01" />
    <path d="M3 3l18 18" />
  </>,
)
export const RefreshIcon = base(
  <>
    <path d="M4 12a8 8 0 0 1 14-5.3L20 8" />
    <path d="M20 4v4h-4" />
    <path d="M20 12a8 8 0 0 1-14 5.3L4 16" />
    <path d="M4 20v-4h4" />
  </>,
)
export const ChevronDownIcon = base(<path d="m6 9 6 6 6-6" />)
export const ChevronLeftIcon = base(<path d="m15 6-6 6 6 6" />)
export const AlertTriangleIcon = base(
  <>
    <path d="M10.3 4.3a2 2 0 0 1 3.4 0l7.3 12.6a2 2 0 0 1-1.7 3H4.7a2 2 0 0 1-1.7-3Z" />
    <path d="M12 9.5v4M12 17v.01" />
  </>,
)
export const UserIcon = base(
  <>
    <circle cx="12" cy="8.5" r="3.25" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </>,
)
export const InboxIcon = base(
  <>
    <path d="M4 13.5 6.5 5h11L20 13.5" />
    <path d="M4 13.5v4A1.5 1.5 0 0 0 5.5 19h13a1.5 1.5 0 0 0 1.5-1.5v-4h-4.7a2.3 2.3 0 0 1-4.6 0H4Z" />
  </>,
)
export const ArrowUpRightIcon = base(<path d="M7 17 17 7M9 7h8v8" />)
export const ArrowDownRightIcon = base(<path d="M7 7 17 17M17 9v8H9" />)
export const SparklesIcon = base(
  <>
    <path d="M12 3.5 13.4 8l4.5 1.4-4.5 1.4L12 15.3 10.6 10.8 6.1 9.4l4.5-1.4Z" />
    <path d="M18.5 15.5 19.2 17.8l2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7Z" />
  </>,
)
export const SettingsIcon = base(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.65 1.65 0 0 0 1.8.3H9a1.65 1.65 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.65 1.65 0 0 0-.3 1.8V9a1.65 1.65 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1Z" />
  </>,
)
export const PaletteIcon = base(
  <>
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.5-.6 1.5-1.4 0-.4-.15-.7-.4-1a1.4 1.4 0 0 1-.35-.9c0-.75.6-1.35 1.35-1.35H15.5A4.5 4.5 0 0 0 20 11.3c0-4.3-3.8-7.8-8-7.8Z" />
    <circle cx="7.5" cy="11" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="10" cy="7.3" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="7.5" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="17" cy="11" r="1.15" fill="currentColor" stroke="none" />
  </>,
)
export const GlobeIcon = base(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.3-3.6-8.5S9.6 5.8 12 3.5Z" />
  </>,
)
export const BookOpenIcon = base(
  <>
    <path d="M12 6.5c-1.4-1.3-3.3-2-6-2-.6 0-1 .4-1 1v11c0 .6.4 1 1 1 2.7 0 4.6.7 6 2 1.4-1.3 3.3-2 6-2 .6 0 1-.4 1-1v-11c0-.6-.4-1-1-1-2.7 0-4.6.7-6 2Z" />
    <path d="M12 6.5v13" />
  </>,
)
export const StarIcon = base(
  <path d="m12 3.5 2.6 5.4 5.9.7-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9-4.3-4.1 5.9-.7Z" />,
)
