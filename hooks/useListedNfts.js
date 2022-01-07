// import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Connection, PublicKey} from "@solana/web3.js";
import { getListedTokensByOwner } from "../lib/utils.js";

const rpcHost = "https://bold-old-forest.solana-devnet.quiknode.pro/648604e1462347d29ab37fa11d7705bbda98640c/"
const connection = new Connection(rpcHost);

const useListedNfts = () => {
//   const wallet = useWallet();
    const wallet = new PublicKey("EEtBUV6kTXa5nGhAd7sgUGHYUFzL2UhiY7u8Q95fh5KE");
  const [isLoading, setIsLoading] = useState(false);

  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    (async () => {
    //   if (
    //     !wallet ||
    //     !wallet.publicKey ||
    //     !wallet.signAllTransactions ||
    //     !wallet.signTransaction
    //   ) {
    //     return;
    //   }

      setIsLoading(true);

    //   const listedTokens = await getListedTokensByOwner(connection, wallet.publicKey);
      const listedTokens = await getListedTokensByOwner(connection, wallet);
      console.log(listedTokens)
	  let nfts = [];
	  for(let token of listedTokens){
          console.log(token.toString());
		  let metadata = await Metadata.load(connection, await Metadata.getPDA(token));
		  let json = await fetch(metadata.data.data.uri).then(e => e.json());
		  json.mint = token;
		  nfts.push(json);
	  }

      setNfts(nfts);
      setIsLoading(false);
    })();
  }, []);

  return [isLoading, nfts];
};

export default useListedNfts;