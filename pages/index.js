import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import * as utils from '../lib/utils.js'
import { PublicKey, Connection, Transaction } from '@solana/web3.js'
import useListedNfts from '../hooks/useListedNfts'



export default function Home() {

  // const [isLoading, nfts] = useListedNfts()
  const publicKey = new PublicKey("EEtBUV6kTXa5nGhAd7sgUGHYUFzL2UhiY7u8Q95fh5KE");

  const token = new PublicKey("2J94tAwTK1Mc7PJCsj93V7sXbN7cZYbUEzUjixQ5n7Ye");

  const candyMachine = new PublicKey("8pL4Sc6AA3gCiyzbdU4yRtRwyNdyS3e1aG9udwZK3jmf");

  const devnet = new Connection("https://bold-old-forest.solana-devnet.quiknode.pro/648604e1462347d29ab37fa11d7705bbda98640c/");

  utils.createSellTokenInstructionRaw(publicKey, token, candyMachine, 2)
  .then(instruction => {

    console.log(instruction)
    // let tx = new Transaction().add(instruction);

    // const signature = await sendTransaction(tx, devnet);
  })

  return (
    <div className={styles.container}>
      {/* {isLoading ? 'Cargando...' : console.log(nfts)} */}

    </div>
  )
}
