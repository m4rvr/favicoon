import { type JSX } from 'solid-js'
import Layout from '../layouts/Layout.js'

export default function (): JSX.Element {
  return (
    <Layout>
      <div class="h-full">
        <div class="max-w-lg px-4 mx-auto">
          <h1 class="text-2xl mb-4 font-medium">Resources</h1>
          <h2 class="mb-2 text-lg font-medium">Preview Images</h2>
          <ul class="list-disc ml-4">
            <li>
              <a
                href="https://www.figma.com/community/file/893615158290526454"
                title="Google Chrome mockups"
                target="_blank"
                class="underline"
              >
                Google Chrome mockups
              </a>{' '}
              by{' '}
              <a
                href="https://www.figma.com/@vance"
                title="Vance Banks"
                target="_blank"
                class="underline"
              >
                Vance Banks
              </a>
            </li>
          </ul>
          <h2 class="mb-2 text-lg mt-5 font-medium">Emojis</h2>
          <p>
            The emojis used for the generator are from the open source project{' '}
            <a
              href="https://github.com/twitter/twemoji"
              title="Twemoji"
              target="_blank"
              class="underline"
            >
              Twemoji
            </a>
            . The graphics are licensed under{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              title="CC-BY 4.0"
              target="_blank"
              class="underline"
            >
              CC-BY 4.0
            </a>{' '}
            and Copyright 2019 Twitter, Inc and other contributors.
          </p>
        </div>
      </div>
    </Layout>
  )
}
