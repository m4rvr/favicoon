import { type JSX } from 'solid-js'
import { Link, Title } from 'solid-meta'

export default function (): JSX.Element {
  return (
    <>
      <Title>Favicoon - Oh no!</Title>
      <Link rel="canonical" href="https://favicon.netlify.app/404" />
      <div>404</div>
    </>
  )
}
