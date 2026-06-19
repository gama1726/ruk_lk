/**
 * @file Иконки соцсетей для публичной зоны (цвет через currentColor).
 */

type IconProps = {
  className?: string
}

function VkIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.426.132-.426s-.02-1.304.587-1.496c.598-.188 1.366 1.258 2.183 1.812.616.426 1.084.333 1.084.333l2.177-.03s1.136-.071.598-.967c-.044-.071-.314-.658-1.618-1.86-1.366-1.254-1.183-.105.462-3.216.998-1.97 1.397-3.17 1.272-3.686-.118-.486-.847-.358-.847-.358l-2.453.015s-.182-.025-.317.056c-.132.079-.216.262-.216.262s-.388 1.03-.904 1.906c-1.09 1.852-1.527 1.95-1.705 1.836-.415-.267-.311-1.074-.311-1.644 0-1.788.27-2.533-.527-2.724-.265-.064-.46-.106-1.138-.113-.87-.009-1.605.003-2.019.208-.277.136-.49.44-.36.458.16.022.522.098.713.36.247.333.238 1.08.238 1.08s.142 2.088-.33 2.347c-.325.178-.771-.185-1.728-1.848-.49-.85-.86-1.788-.86-1.788s-.071-.178-.198-.274c-.154-.116-.37-.152-.37-.152l-2.333.015s-.35.01-.478.162c-.114.136-.009.417-.009.417s1.834 4.292 3.908 6.456c1.902 1.987 4.067 1.856 4.067 1.856h.978z"
      />
    </svg>
  )
}

function TelegramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.665 3.985c.36-.158.74.082.66.47l-2.52 11.84c-.09.41-.44.66-.82.52l-3.84-1.42-1.85 1.78c-.17.17-.44.04-.44-.2v-2.58l7.12-6.44c.16-.14-.04-.22-.24-.08l-8.8 5.54-3.79-1.26c-.41-.14-.42-.7.01-.86l14.78-5.7z"
      />
    </svg>
  )
}

function YoutubeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.58 7.19a2.75 2.75 0 0 0-1.94-1.95C18.25 5 12 5 12 5s-6.25 0-7.64.24a2.75 2.75 0 0 0-1.94 1.95A28.6 28.6 0 0 0 2 12a28.6 28.6 0 0 0 .42 4.81 2.75 2.75 0 0 0 1.94 1.95C5.75 19 12 19 12 19s6.25 0 7.64-.24a2.75 2.75 0 0 0 1.94-1.95A28.6 28.6 0 0 0 22 12a28.6 28.6 0 0 0-.42-4.81zM10 15.5v-7l6 3.5-6 3.5z"
      />
    </svg>
  )
}

const icons = {
  vk: VkIcon,
  tg: TelegramIcon,
  yt: YoutubeIcon,
} as const

type SocialId = keyof typeof icons

/**
 * Иконка соцсети по id из {@link socialLinks}.
 */
export function SocialIcon({ id, className }: { id: string; className?: string }) {
  const Icon = icons[id as SocialId]
  if (!Icon) return null
  return <Icon className={className} />
}
