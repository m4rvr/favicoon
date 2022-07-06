import { type JSX } from 'solid-js'
import Generator from '../components/Generator.js'
import Layout from '../layouts/Layout.js'

export default function (): JSX.Element {
  return (
    <Layout>
      <Generator />
    </Layout>
  )
}