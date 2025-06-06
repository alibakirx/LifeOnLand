import Head from 'next/head'
import LifeOnLand from '../components/LifeOnLand'

export default function Home() {
  return (
    <>
      <Head>
        <title>Life on Land - Interactive Ecosystem</title>
        <meta name="description" content="Interactive grassland ecosystem simulation with land animals" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LifeOnLand />
    </>
  )
} 