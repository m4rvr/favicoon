import { type JSX } from 'solid-js'
import { Link, Title } from 'solid-meta'
import Layout from '../layouts/Layout.js'

export default function (): JSX.Element {
  return (
    <Layout>
      <Title>Favicoon - Favicon Tools</Title>
      <Link rel="canonical" href="https://favicon.netlify.app/" />
      <div>Index</div>
    </Layout>
  )
}
