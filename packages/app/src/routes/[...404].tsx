import { type JSX } from 'solid-js'
import { Link as HeadLink, Title } from 'solid-meta'
import { Link } from 'solid-app-router'
import Layout from '../layouts/Layout.js'

export default function (): JSX.Element {
  return (
    <Layout>
      <Title>Favicoon - Oh no!</Title>
      <HeadLink rel="canonical" href="https://favicon.netlify.app/404" />
      <div class="h-full flex flex-col items-center justify-center pb-50 gap-5">
        <h1 class="text-8xl font-medium">404 😕</h1>
        <h2 class="text-2xl">This page doesn't exist.</h2>
        <Link
          href="/favicon-generator/image"
          class="bg-neutral-900 mt-5 text-white rounded-lg px-4 py-2 transition-transform hover:scale-103"
        >
          Back to Favicon Generator
        </Link>
      </div>
    </Layout>
  )
}
