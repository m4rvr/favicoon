import { type JSX } from 'solid-js'
import { Link, useMatch } from 'solid-app-router'

export default function (): JSX.Element {
  const isGeneratorActive = useMatch(() => '/favicon-generator')
  // const isCheckerActive = useMatch(() => '/favicon-checker')

  return (
    <nav class="my-5 flex items-center justify-center font-medium text-sm">
      <Link
        href="/favicon-generator"
        class="block px-4 py-2"
        classList={{
          'text-blue-500': !!isGeneratorActive()
        }}
      >
        Favicon Generator
      </Link>
    </nav>
  )
}

/*
<Link
  href="/favicon-checker"
  class="block px-4 py-2"
  classList={{
    'text-blue-500': !!isCheckerActive()
  }}
>
  Favicon Checker
</Link>
*/
