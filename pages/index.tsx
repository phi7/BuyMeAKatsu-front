import { ethers } from "ethers";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import KatsuJson from "../utils/BuyMeAKatsu.json";
import JPYCJson from "../utils/JPYC.json";

const Home: NextPage = () => {
  const jpycContractAddress = "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB";
  const jpycContractABI = JPYCJson.abi;
  const katsuContractAddress = "0xF2D175B24559170d6450B17550C2C51e2DF452f6";
  const katsuContractABI = KatsuJson.abi;

  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isMining, setIsMinging] = useState(false);

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const onMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const isWalletConnected = async () => {
    try {
      const { ethereum } = window as any;

      const accounts = await ethereum.request({ method: "eth_accounts" });
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("wallet is connected! " + account);
        setCurrentAccount(account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);

      //ネットワークの確認
      let chainId = await ethereum.request({ method: "eth_chainId" });
      console.log("Connected to chain " + chainId);
      const polygonChainId = "137";
      if (chainId !== polygonChainId) {
        alert("You are not connected to the Polygon Network!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const buyKatsu = async () => {
    try {
      const { ethereum } = window as any;

      console.log("buyカツ押された");

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeAKatsu = new ethers.Contract(
          katsuContractAddress,
          katsuContractABI,
          signer
        );
        const jpyc = new ethers.Contract(
          jpycContractAddress,
          jpycContractABI,
          signer
        );

        // const tip = { value: ethers.utils.parseEther("100") };
        const price = "100";
        setIsMinging(true);
        console.log("approve");
        const approveFlag = await jpyc.approve(
          buyMeAKatsu.address,
          ethers.utils.parseUnits(price, 18)
        );
        await approveFlag.wait();

        console.log("buying katsu..");
        const katsuTxn = await buyMeAKatsu.buyKatsu(
          name ? name : "名もなきトンカツ",
          message ? message : "おつカツ!",
          ethers.utils.parseUnits(price, 18)
          // tip.value
        );

        await katsuTxn.wait();

        console.log("katstu hash", katsuTxn.hash);

        setName("");
        setMessage("");
        setIsMinging(false);

        alert("無事JPYCを送れたよ！");
      }
    } catch (error) {
      console.log(error);
      alert(error);
    }
  };

  const buyBigKatsu = async () => {
    try {
      const { ethereum } = window as any;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeAKatsu = new ethers.Contract(
          katsuContractAddress,
          katsuContractABI,
          signer
        );
        const jpyc = new ethers.Contract(
          jpycContractAddress,
          jpycContractABI,
          signer
        );
        setIsMinging(true);
        const tip = { value: ethers.utils.parseEther("3") };
        jpyc.approve(buyMeAKatsu.address, tip.value);
        console.log("buying katsu..");
        const katsuTxn = await buyMeAKatsu.buyKatsu(
          name ? name : "anon",
          message ? message : "Ihansya ni Katsu!",
          tip.value
        );

        await katsuTxn.wait();

        console.log("katstu hash", katsuTxn.hash);

        setName("");
        setMessage("");
        setIsMinging(false);

        alert("無事JPYCを送れたよ！");
      }
    } catch (error) {
      console.log(error);
      alert(error);
      setIsMinging(false);
    }
  };

  // const iroiroAlert = (comment: string, judge: string) => {
  //   return (
  //     <div className={`alert ${judge} shadow-lg`} role="alert">
  //       <div>
  //         <svg
  //           xmlns="http://www.w3.org/2000/svg"
  //           className="stroke-current shrink-0 h-6 w-6"
  //           fill="none"
  //           viewBox="0 0 24 24"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth="2"
  //             d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
  //           />
  //         </svg>
  //         <span>{comment}</span>
  //       </div>
  //     </div>
  //   );
  // };

  const getMemos = async () => {
    try {
      const { ethereum } = window as any;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeAKatsu = new ethers.Contract(
          katsuContractAddress,
          katsuContractABI,
          signer
        );

        console.log("fetching memos from the blockchain..");
        const memos = await buyMeAKatsu.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  type Memo = {
    from: string;
    timestamp: Date;
    name: string;
    message: string;
  };

  useEffect(() => {
    let buyMeAKatsu: ethers.Contract;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (
      from: string,
      timestamp: number,
      name: string,
      message: string
    ) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos(
        (prevState: Memo[]) =>
          [
            ...prevState,
            {
              address: from,
              timestamp: new Date(timestamp * 1000),
              message,
              name,
            },
          ] as Memo[]
      );
    };

    const { ethereum } = window as any;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeAKatsu = new ethers.Contract(
        katsuContractAddress,
        katsuContractABI,
        signer
      );

      buyMeAKatsu.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeAKatsu) {
        buyMeAKatsu.off("NewMemo", onNewMemo);
      }
    };
  }, [isMining]);

  // useEffect(() => {
  //   isWalletConnected();
  // }, [isMining]);

  return (
    <div className="flex flex-col items-center justify-center bg-slate-200 min-h-screen">
      <style jsx>
        {`
          .guruguru {
          }
        `}
      </style>
      <div className="grow flex flex-col items-center justify-center">
        <br />
        <div className="text-3xl font-bold underline text-black">
          BuyMeAKatsu!!
        </div>
        <br />
        {isMining ? (
          <div>
            <a
              href="https://ja.wikipedia.org/wiki/%E3%82%AB%E3%83%84"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/katsu.png"
                width={64}
                height={64}
                alt="katsu"
                className="animate-rotate-center"
              />
            </a>
            <div className="text-black">処理中...</div>
          </div>
        ) : (
          <a
            href="https://ja.wikipedia.org/wiki/%E3%82%AB%E3%83%84"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src="/katsu.png" width={64} height={64} alt="katsu" />
          </a>
        )}
        <br />
        <div className="text-gray-700 m-2">
          感謝の気持ちにひとくちカツを送れます！
        </div>
        {currentAccount ? (
          <div className="flex flex-col items-center justify-center">
            <label className="label">
              <span className="label-text text-gray-500">あなたのお名前</span>
            </label>
            <input
              type="text"
              placeholder="例：勝 大好太郎"
              className="input w-full max-w-xs"
              onChange={onNameChange}
            />
            <label className="label">
              <span className="label-text text-gray-500">Message</span>
            </label>
            <textarea
              className="textarea form-control w-full max-w-xs"
              placeholder="例：イ反社にカツ！"
              onChange={onMessageChange}
            ></textarea>
            <br />
            <div className="flex flex-row">
              <div className="btn bg-blue-800 m-2" onClick={buyKatsu}>
                １口カツを送る
              </div>
              {/* <div className="btn bg-blue-800 m-2" onClick={buyBigKatsu}>
                ビッグ１口カツを送る
              </div> */}
            </div>
            <br />
            <div className="text-gray-500">※1口カツは100JPYC！</div>
            <a
              href="https://quickswap.exchange/#/swap"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500"
            >
              QuickSwapでJPYCを手に入れる
            </a>
            <a
              href="https://app.jpyc.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500"
            >
              公式サイトでJPYCを手に入れる
            </a>
          </div>
        ) : (
          <div className="btn" onClick={connectWallet}>
            connect Wallet
          </div>
        )}
        <br />
        {currentAccount && (
          <div className="text-gray-500 text-lg">
            ↓私のカツスポンサーさんたち↓
          </div>
        )}

        {currentAccount &&
          memos.map((memo, idx) => {
            return (
              // <div key={idx}>
              <div key={idx} className="card w-96 bg-base-100 shadow-xl m-2">
                <div className="card-body">
                  <h2 className="card-title">{memo.message}</h2>
                  <p>From: {memo.name}</p>
                  {/* <div className="card-actions justify-end">
                      at {memo.timestamp.toString()}
                    </div> */}
                </div>
              </div>
              // </div>
            );
          })}
      </div>

      <br />

      <footer className="bg-gray-800 w-screen flex flex-col items-center">
        <a
          href="https://twitter.com/phi_hash2"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-center text-xs"
        >
          @phi_hash2
        </a>
      </footer>
    </div>
  );
};

export default Home;
