import { type JSX } from 'solid-js'
import { Link as HeadLink, Title } from 'solid-meta'
import Generator from '../components/Generator/index.js'
import Layout from '../layouts/Layout.js'

export default function (): JSX.Element {
  return (
    <Layout title="Favicon Generator">
      <Title>Favicoon - Favicon Generator</Title>
      <HeadLink
        rel="canonical"
        href="https://favicon.netlify.app/favicon-generator"
      />
      <Generator />
    </Layout>
  )
}
