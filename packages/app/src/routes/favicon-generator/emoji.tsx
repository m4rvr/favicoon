import { type JSX } from 'solid-js'
import { Link as HeadLink, Title } from 'solid-meta'
import Generator from '../../components/Generator/index.js'
import Layout from '../../layouts/Layout.js'
import EmojiGenerator from '../../components/Generator/EmojiFavicon/index.js'
import EmojiFaviconProvider from '../../context/EmojiFaviconContext.js'

export default function (): JSX.Element {
  return (
    <Layout title="Emoji Favicon Generator">
      <Title>Favicoon - Emoji Favicon Generator</Title>
      <HeadLink
        rel="canonical"
        href="https://favicon.netlify.app/favicon-generator/emoji"
      />
      <Generator>
        <EmojiFaviconProvider>
          <EmojiGenerator />
        </EmojiFaviconProvider>
      </Generator>
    </Layout>
  )
}
