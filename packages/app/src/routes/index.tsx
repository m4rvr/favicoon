import { type JSX } from 'solid-js'
import { Link, Meta, Title } from 'solid-meta'
import Layout from '../layouts/Layout.js'

export default function (): JSX.Element {
  return (
    <Layout>
      <Title>Favicoon - Favicon Tools</Title>
      <Link rel="canonical" href="https://favicoon.com/" />
      <Meta property="og:type" content="website" />
      <Meta
        property="og:title"
        content="Favicoon.com - Free multi-purpose favicon generator"
      />
      <Meta
        property="og:description"
        content="Quickly generate a favicon from an image or emoji for your website for free."
      />
      <Meta property="og:image" content="/og-image.png" />
      <Meta property="twitter:url" content="https://favicoon.com" />
      <Meta
        property="twitter:title"
        content="Favicoon.com - Free multi-purpose favicon generator"
      />
      <Meta
        property="twitter:description"
        content="Quickly generate a favicon from an image or emoji for your website for free."
      />
      <Meta
        name="description"
        content="Quickly generate a favicon from an image or emoji for your website for free."
      />
      <div>Index</div>
    </Layout>
  )
}
