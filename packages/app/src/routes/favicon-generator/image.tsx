import { type JSX } from 'solid-js'
import { Link as HeadLink, Meta, Title } from 'solid-meta'
import Generator from '../../components/Generator/index.js'
import ImageGenerator from '../../components/Generator/ImageFavicon/index.js'
import ImageFaviconProvider from '../../context/ImageFaviconContext.js'
import Layout from '../../layouts/Layout.js'

export default function (): JSX.Element {
  return (
    <Layout title="Image Favicon Generator">
      <Title>Favicoon - Image Favicon Generator</Title>
      <HeadLink
        rel="canonical"
        href="https://favicoon.com/favicon-generator/image"
      />
      <Meta property="og:type" content="website" />
      <Meta
        property="og:title"
        content="Favicoon.com - Free image favicon generator"
      />
      <Meta
        property="og:description"
        content="Quickly generate a favicon from an emoji for your website for free."
      />
      <Meta property="og:image" content="/og-image-image.png" />
      <Meta property="twitter:image" content="/og-image-image.png" />
      <Meta
        property="twitter:url"
        content="https://favicoon.com/favicon-generator/image"
      />
      <Meta
        property="twitter:title"
        content="Favicoon.com - Free image favicon generator"
      />
      <Meta
        property="twitter:description"
        content="Quickly generate a favicon from an image for your website for free."
      />
      <Meta
        name="description"
        content="Quickly generate a favicon from an image for your website for free."
      />
      <Generator>
        <ImageFaviconProvider>
          <ImageGenerator />
        </ImageFaviconProvider>
      </Generator>
    </Layout>
  )
}
