import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import tokenABI from "../../Abi/token.json";

// import {MFABI, TOKEN_ABI, URL, etherscan} from './secret';
import "./App.css";
let userAddress;
let signer;
let provider;
let token_contract;
let abiCoder;

// let link = etherscan;

const tokenRecipientAddr = "0xFc8FF46D260D0b23Ee31357a1AE9F1c18ABBD28D";
const recipient = "0x85Ee6Ce038A5518Eb7897578ffDf675eF06dB3F7";

function App() {
  async function getSigner(e) {
    e.preventDefault();
    abiCoder = new ethers.utils.AbiCoder();
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();

      userAddress = (await signer.getAddress()) || "";
      console.log(
        ">>>>>>>>>>>>>>>>>>>>>>>>>>userAddress>>>>>>>>>>>",
        userAddress
      );

      if (provider.network.chainId != 5) {
        // https://rpc.goerli.dev
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [
            {
              chainId: "0x5",
            },
          ],
        });
      }

      setMessage("Mint Tokens :");
    } catch {
      getSigner();
    }
  }

  async function bal() {
    let balance = await token_contract.balanceOf(userAddress);
    return parseInt(balance);
  }

  async function signMessage(e) {
    e.preventDefault();
    const tokenRecipient = new ethers.Contract(
      tokenRecipientAddr,
      tokenABI,
      provider
    );

    const nonce = await tokenRecipient.nonces(userAddress);
    // const nonce = "0";
    const hexToDecimal = (hex) => parseInt(hex, 16);
    console.log(
      ">>>>>>>>>>>>>>>>>>>>>>>>>>nonce>>>>>>>>>>>",
      hexToDecimal(nonce)
    );
    const Nonces = hexToDecimal(nonce).toString();
    let data = abiCoder.encode(["address", "uint256"], [userAddress, amount]);
    data = data.slice(2, data.length);
    const Req = {
      nonce: Nonces,
      verifyingAddress: tokenRecipientAddr,
      chainId: "5",
      // data: "0x40c10f19" + data,
    };
    const callData = "0x40c10f19" + data; /// in api
    console.log(">>>>>>>>>>>>>>>>data>>>>>>>>>>", callData);
    console.log(">>>>>>>>>>>>>>>>Req>>>>>>>>>>", Req);

    let message = ethers.utils.solidityKeccak256(
      ["uint256", "address", "uint256"],
      [Req.nonce, Req.verifyingAddress, Req.chainId]
    );
    console.log(">>>>>>>>>>>>>>>>message>>>>>>>>>>", message);

    const arrayifyMessage = await ethers.utils.arrayify(message);
    console.log(">>>>>>>>>>>>>>>>arrayifyMessage>>>>>>>>>>", arrayifyMessage);

    const flatSignature = await signer.signMessage(arrayifyMessage); // signature
    console.log(">>>>>>>>>>>>>>>>flatSignature>>>>>>>>>>", flatSignature);

    try {
      const signatureValues = await ethers.utils.splitSignature(flatSignature);
      console.log(
        ">>>>>>>>>>>>>>>>>>>>>signatureValues>>>>>>>>>>>>>>>>>",
        signatureValues
      );

      const verifyMessage = await ethers.utils.verifyMessage(
        message,
        flatSignature
      );
      console.log(
        ">>>>>>>>>>>>>>>>>>>>>verifyMessage>>>>>>>>>>>>>>>>>",
        verifyMessage
      );
    } catch (error) {}

    try {
      let data = JSON.stringify({
        callData: callData,
        signature: flatSignature,
        message: message,
        payable: "0",
        userAddress: userAddress.toString(),
      });

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "http://localhost:3000/relay/process",
        headers: {
          accept: "appication/json",
          "Content-Type": "application/json",
        },
        data: data,
      };

      const response = await axios.request(config);
      console.log(">>>>>>>>>>>>>>>>>>>>>>data>>>>>>>>>>>>>>",response);
    } catch (error) {}

    // try {
    //   const execute = await axios.get(
    //     `${URL}${JSON.stringify(Req)}&signature=${flatSignature}`
    //   )
    //   if(execute.data.success) {
    //     link = etherscan + execute.data.message
    //     document.getElementById('etherscanLink').innerHTML = `<a href=${link} target="blank">See tx</a>`
    //     console.log(link);
    //   } else {
    //     alert('Tx failed with error: ' + execute.data.message);
    //   }
    // } catch(error) {
    //   alert(error.message);
    // }
  }

  function updateAmount(direction) {
    if (userAddress != "") {
      if (direction == "up" && amount < 100000000) {
        setAmount(amount + 1);
      } else if (direction == "down" && amount > 1) {
        setAmount(amount - 1);
      }
    }
  }

  function bulkSigner() {}

  const [amount, setAmount] = useState(1);
  const [message, setMessage] = useState("Connect Wallet");

  return (
    <div className="App">
      <h1>Libfi Relayer Service</h1>
      <p>Goerli Network</p>
      <p>Mint Tokens with No Gas Fees!</p>
      {/* <div id="etherscanLink">

      </div> */}
      <div className="card">
        <p>
          {message == "Connect Wallet"
            ? "Not Connected"
            : "Connected: " + userAddress}
        </p>

        <form
          onSubmit={(e) =>
            message == "Connect Wallet" ? getSigner(e) : signMessage(e)
          }
        >
          <button type="submit">
            {message == "Connect Wallet" ? message : message + " " + amount}
          </button>
        </form>

        <button onClick={() => updateAmount("up")}>^</button>
        <button onClick={() => updateAmount("down")}>v</button>
        <form>
          <button onClick={() => bulkSigner()}>Bulk Signer</button>
        </form>
      </div>
    </div>
  );
}

export default App;
