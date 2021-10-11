// originally developed ad Replit: https://replit.com/@xcanchal/nft-starter-repo-final#src/App.js

import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import myEpicNft from './utils/MyEpicNFT.json';

const TWITTER_HANDLE = 'xcanchal';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/squarenft-npny40he2b';
const CONTRACT_ADDRESS = "0x4F6494c627Fa3518aB766bA92e75b739f0858C5A";
// String, hex code of the chainId of the Rinkebey test network
const rinkebyChainId = "0x4";

const App = () => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [mintingStats, setMintingStats] = useState({});
    const [minting, setMinting] = useState(false);
    const [wrongChain, setWrongChain] = useState(false);

    const checkIfWalletIsConnected = async () => {
      const { ethereum } = window;

      if (!ethereum) {
          console.log("Make sure you have metamask!");
          return;
      } else {
          console.log("We have the ethereum object", ethereum);
      }

      setWrongChain(false);
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);

      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
        setWrongChain(true);
      } else {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length !== 0) {
            const account = accounts[0];
            console.log("Found an authorized account:", account);
            setCurrentAccount(account)

            // Setup listener! This is for the case where a user comes to our site
            // and ALREADY had their wallet connected + authorized.
            setupEventListener()
        } else {
            console.log("No authorized account found")
        }
      }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener()
    } catch (error) {
      console.log(error)
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();

        setMinting(true);
        console.log("Mining...please wait.")
        await nftTxn.wait();
        setMinting(false);

        await updateMintingStats();
        console.log(nftTxn);
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
      if (error.message && error.message.includes('All NFTs have been minted')) {
        alert('Sorry! All NFTs have already been minted. Check them out on OpenSea.');
      }
    }
  }

  const getMintingStats = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        const totalMinted = await  contract.getTotalNFTsMintedSoFar();
        console.log('totalMinted', totalMinted.toNumber());
        const maxNfts = await contract.maxNfts();
        console.log('maxNfts', maxNfts);

        return { current: totalMinted.toNumber(), total: maxNfts };
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    }  catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const updateMintingStats = async () => {
    const mintingStats = await getMintingStats();
    setMintingStats(mintingStats);
  };

  useEffect(() => {
    (async () => {
      if (currentAccount !== "") {
        await updateMintingStats();
      }
    })();
  }, [currentAccount]);

  console.dir({
    currentAccount,
    wrongChain,
    minting,
    mintingStats
  });

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? (
            <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
          ) : (
            <button onClick={askContractToMintNft} className={`cta-button connect-wallet-button ${minting || wrongChain ? 'disabled' : ''}`}>
                {minting ? "Minting..." : "Mint NFT"}
              </button>
          )}
          {!!mintingStats.current && (
            <>
            <p className="minting-stats">{`${mintingStats.current}/${mintingStats.total} minted so far`}
            </p>
            <a href={OPENSEA_LINK} target="_blank">See collection on OpenSea</a>
            </>
          )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
