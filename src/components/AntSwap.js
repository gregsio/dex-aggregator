import React, { useState, useEffect, useContext } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import tokenList from "../tokenList.json";

import { useSelector, useDispatch } from "react-redux";
import Dropdown from "react-bootstrap/Dropdown";
import Spinner from "react-bootstrap/Spinner";
import { ethers } from "ethers";
import Alert from "./Alert";
import { swap, loadAccount } from "../store/interactions";
import { ContractsContext } from "./ContractContext";


import {
  Container,
  SwapContainer,
} from "../styles/StyledComponents";


const Swap = () => {
  // begin variables added from Swap.js

  console.log("Swap component re-rendered");
  const contracts = useContext(ContractsContext);
  const [inputAmount, setInputAmount] = useState(0);
  const [outputAmount, setOutputAmount] = useState(0);
  const [bestDeal, setBestDeal] = useState(null);
  const [router, setRouter] = useState(null);
  const [path, setPath] = useState([]);
  const [price, setPrice] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  const provider = useSelector((state) => state.provider.connection);
  const account = useSelector((state) => state.provider.account);
  const isSwapping = useSelector(
    (state) => state.aggregator.swapping.isSwapping
  );
  const isSuccess = useSelector((state) => state.aggregator.swapping.isSuccess);
  const transactionHash = useSelector(
    (state) => state.aggregator.swapping.transactionHash
  );

  const symbols = useSelector((state) => state.tokens.symbols);
  // const balances = useSelector(state => state.tokens.balances)
  const dispatch = useDispatch();

  const connectHandler = async () => {
    await loadAccount(dispatch);
  };
// end variables added from Swap.js


//   const { address, isConnected } = props;
//   const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState(2.5);
  const [inputToken, setInputToken] = useState(tokenList[0]);
  const [outputToken, setOutputToken] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
//   const [txDetails, setTxDetails] = useState({
//     to:null,
//     data: null,
//     value: null,
//   });

//   const {data, sendTransaction} = useSendTransaction({
//     request: {
//       from: address,
//       to: String(txDetails.to),
//       data: String(txDetails.data),
//       value: String(txDetails.value),
//     }
//   })

//   const { isLoading, isSuccess } = useWaitForTransaction({
//     hash: data?.hash,
//   })

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

//   function changeAmount(e) {
//     setTokenOneAmount(e.target.value);
//     if(e.target.value && prices){
//       setOutputAmount((e.target.value * prices.ratio).toFixed(2))
//     }else{
//       setOutputAmount(null);
//     }
//   }

  function switchTokens() {
    setPrices(null);
    setInputAmount(null);
    setOutputAmount(null);
    const input = inputToken;
    const output = outputToken;
    setInputToken(output);
    setOutputToken(input);
    // fetchPrices(two.address, one.address);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }

  function modifyToken(i){
    setPrices(null);
    setInputAmount(null);
    setOutputAmount(null);
    if (changeToken === 1) {
      setInputToken(tokenList[i]);
     // fetchPrices(tokenList[i].address, outputToken.address)
    } else {
      setOutputToken(tokenList[i]);
     // fetchPrices(inputToken.address, tokenList[i].address)
    }
    setIsOpen(false);
  }

//   async function fetchPrices(one, two){

//       const res = await axios.get(`http://localhost:3001/tokenPrice`, {
//         params: {addressOne: one, addressTwo: two}
//       })


//       setPrices(res.data)
//   }

//   async function fetchDexSwap(){

//     const allowance = await axios.get(`https://api.1inch.io/v5.0/1/approve/allowance?tokenAddress=${inputToken.address}&walletAddress=${address}`)

//     if(allowance.data.allowance === "0"){

//       const approve = await axios.get(`https://api.1inch.io/v5.0/1/approve/transaction?tokenAddress=${inputToken.address}`)

//       setTxDetails(approve.data);
//       console.log("not approved")
//       return

//     }

//     const tx = await axios.get(
//       `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${inputToken.address}&toTokenAddress=${outputToken.address}&amount=${inputTokenAmount.padEnd(inputToken.decimals+inputTokenAmount.length, '0')}&fromAddress=${address}&slippage=${slippage}`
//     )

//     let decimals = Number(`1E${outputToken.decimals}`)
//     setOutputAmount((Number(tx.data.toTokenAmount)/decimals).toFixed(2));

//     setTxDetails(tx.data.tx);

 // }


//   useEffect(()=>{

//     fetchPrices(tokenList[0].address, tokenList[1].address)

//   }, [])

//   useEffect(()=>{

//       if(txDetails.to && isConnected){
//         sendTransaction();
//       }
//   }, [txDetails])

//   useEffect(()=>{

//     messageApi.destroy();

//     if(isLoading){
//       messageApi.open({
//         type: 'loading',
//         content: 'Transaction is Pending...',
//         duration: 0,
//       })
//     }

//   },[isLoading])

//   useEffect(()=>{
//     messageApi.destroy();
//     if(isSuccess){
//       messageApi.open({
//         type: 'success',
//         content: 'Transaction Successful',
//         duration: 1.5,
//       })
//     }else if(txDetails.to){
//       messageApi.open({
//         type: 'error',
//         content: 'Transaction Failed',
//         duration: 1.50,
//       })
//     }


//   },[isSuccess])


  const getPrice = async () => {
    console.log("getPrice/inputAmount", inputAmount);
    if (inputToken === outputToken) {
      setPrice(0);
    }
    if (inputAmount === "0") {
      setPrice("N/A");
      return;
    }

    if (outputAmount && inputAmount) {
      const price = Number(bestDeal) / Number(inputAmount);
      setPrice(price.toString());
    }
  };

  const handleInputChange = async (e) => {
    console.log("handleInputChange triggered"); // Log when the function is triggered

    if (!e.target.value) {
      setOutputAmount("0");
      setInputAmount("0");
      console.log("No input value provided"); // Log if no input value is provided
      return;
    }
    const enteredAmount = ethers.parseEther(e.target.value.toString());
    console.log("Entered amount:", enteredAmount.toString()); // Log the entered amount

    // Set the input amount
    setInputAmount(enteredAmount.toString());

    // Check to make sure the tokens are set before attempting to convert
    if (!inputToken || !outputToken) {
      alert("Please select both input and output tokens.");
      console.log("Input or output token not selected"); // Log if tokens are not selected
      return;
    }

    // Ensure the input token isn't the same as the output token
    if (inputToken === outputToken) {
      alert("Input and output tokens cannot be the same");
      console.log("Input and output tokens are the same"); // Log if input and output tokens are the same
      return;
    }

    // The logic for setting the path and fetching the best deal
    // has been moved to useEffect hooks.
  };


  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        {/* <Radio.Group value={slippage} onChange={handleSlippageChange}> */}
        <Radio.Group>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  // Effect to update the path whenever inputToken or outputToken changes
  useEffect(() => {
    if (inputToken && outputToken && inputToken !== outputToken) {
    //  setPath([symbols.get(inputToken), symbols.get(outputToken)]);
    setPath([inputToken.address, outputToken.address]);

    }
    if (inputToken && outputToken && inputToken === outputToken) {
      setPath([]);
    }
  }, [inputToken, outputToken, symbols]);


  // Effect to call getBestAmountsOutOnUniswapForks whenever path or inputAmount changes
  useEffect(() => {
    const fetchBestDeal = async () => {
      if (path.length === 2 && inputAmount) {
        // try {
        const fetchBestDealResult =
          await contracts.aggregator.getBestAmountsOutOnUniswapForks(
            path,
            inputAmount
          );
        console.log("fetchBestDealResult:", fetchBestDealResult);
        setBestDeal(fetchBestDealResult[0]);
        setRouter(fetchBestDealResult[1]);

        // Set the output amount
        let calculatedOutputAmount = ethers.formatUnits(fetchBestDealResult[0],18); // Convert the result to a human-readable format
        setOutputAmount(parseFloat(calculatedOutputAmount).toFixed(2)); // Update the outputAmount state

        // } catch (error) {
        //     console.error('Error fetching best deal:', error);
        // }
      } else {
        console.log("path.length/inputAmout", path.length, inputAmount);
      }
    };
    fetchBestDeal();
  }, [path, inputAmount, contracts.aggregator]);

  useEffect(() => {
    getPrice();
  }, [inputAmount, inputToken, outputToken, bestDeal]); 


  return (
    <Container>
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {tokenList?.map((e, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={() => modifyToken(i)}
              >
                <img src={e.img} alt={e.ticker} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName">{e.name}</div>
                  <div className="tokenTicker">{e.ticker}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="inputs">
          <Input
            // placeholder="0"
            // value={inputTokenAmount}
            // onChange={changeAmount}
            onChange={handleInputChange}

            // disabled={!prices}
          />
          <Input placeholder="0" value={outputAmount} disabled={true} />
          <div className="switchButton" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={inputToken.img} alt="assetOneLogo" className="assetLogo" />
            {inputToken.ticker}
            <DownOutlined />
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            <img src={outputToken.img} alt="assetOneLogo" className="assetLogo" />
            {outputToken.ticker}
            <DownOutlined />
          </div>
        </div>
        {/* <div className="swapButton" disabled={!inputTokenAmount || !isConnected} onClick={fetchDexSwap}>Swap</div> */}
        <div className="swapButton">Swap</div>
      </div>
      </Container>
      );
}

export default Swap;
