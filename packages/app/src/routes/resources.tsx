import { type JSX } from 'solid-js'
import Layout from '../layouts/Layout.js'

export default function (): JSX.Element {
  return (
    <Layout>
      <div class="h-full">
        <div class="max-w-lg px-4 mx-auto">
          <h1 class="text-2xl mb-4 font-medium">Resources</h1>
          <h2 class="mb-2 text-lg">Preview Images</h2>
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
        </div>
      </div>
    </Layout>
  )
}
