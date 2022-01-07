import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";
import { getNFTsForOwner } from "../utils/candyMachine";

const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST;
const connection = new Connection(rpcHost);

const useWalletNfts = () => {
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    (async () => {
      if (
        !wallet ||
        !wallet.publicKey ||
        !wallet.signAllTransactions ||
        !wallet.signTransaction
      ) {
        return;
      }

      setIsLoading(true);

      const nftsForOwner = await getNFTsForOwner(connection, wallet.publicKey);

      setNfts(nftsForOwner);
      setIsLoading(false);
    })();
  }, [wallet]);

  return [isLoading, nfts];
};

export default useWalletNfts;