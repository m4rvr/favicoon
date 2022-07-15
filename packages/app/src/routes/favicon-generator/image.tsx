import { type JSX } from 'solid-js'
import { Link as HeadLink, Title } from 'solid-meta'
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
        href="https://favicon.netlify.app/favicon-generator/image"
      />
      <Generator>
        <ImageFaviconProvider>
          <ImageGenerator />
        </ImageFaviconProvider>
      </Generator>
    </Layout>
  )
}
