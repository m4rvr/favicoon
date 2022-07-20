import { type JSX } from 'solid-js'
import { Link as HeadLink, Meta, Title } from 'solid-meta'
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
        href="https://favicoon.com/favicon-generator/emoji"
      />
      <Meta property="og:type" content="website" />
      <Meta
        property="og:title"
        content="Favicoon.com - Free emoji favicon generator"
      />
      <Meta
        property="og:description"
        content="Quickly generate a favicon from an emoji for your website for free."
      />
      <Meta property="og:image" content="/og-image-emoji.png" />
      <Meta
        property="twitter:url"
        content="https://favicoon.com/favicon-generator/emoji"
      />
      <Meta
        property="twitter:title"
        content="Favicoon.com - Free emoji favicon generator"
      />
      <Meta
        property="twitter:description"
        content="Quickly generate a favicon from an emoji for your website for free."
      />
      <Meta
        name="description"
        content="Quickly generate a favicon from an emoji for your website for free."
      />
      <Generator>
        <EmojiFaviconProvider>
          <EmojiGenerator />
        </EmojiFaviconProvider>
      </Generator>
    </Layout>
  )
}
