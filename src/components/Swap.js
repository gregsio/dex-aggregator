import React, { useState, useEffect, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import Dropdown from "react-bootstrap/Dropdown";
import Spinner from "react-bootstrap/Spinner";
import { ethers } from "ethers";

import Alert from "./Alert";
import { swap, loadAccount } from "../store/interactions";
import {
  Container,
  InputField,
  SwapContainer,
  TokenInfoContainer,
  StyledDropdown,
  SwapButton,
  ExchangeRateText,
} from "../styles/StyledComponents";
import { ContractsContext } from "./ContractContext";

const Swap = () => {
  console.log("Swap component re-rendered");
  const contracts = useContext(ContractsContext);
  const [inputToken, setInputToken] = useState(null);
  const [outputToken, setOutputToken] = useState(null);
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

  const swapHandler = async (e) => {
    e.preventDefault();

    if (inputToken === outputToken) {
      window.alert("Invalid Token Pair");
      return;
    }

    // const _inputAmount = ethers.parseUnits(inputAmount, 'ether')

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const slippage = 0;

    console.log(
      //contracts.aggregator,
      provider,
      path,
      router,
      inputAmount,
      bestDeal,
      slippage,
      deadline
    );

    await swap(
      provider,
      contracts,
      path,
      router,
      inputAmount,
      bestDeal,
      slippage,
      deadline,
      dispatch
    );

    console.log(
      //contracts.aggregator,
      provider,
      path,
      router,
      inputAmount,
      bestDeal,
      slippage,
      deadline
    );

    setShowAlert(true);
  };

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

  // TODO: display network fee
  // const getNetworkFee = async () => {
  // }

  const handleTokenSelection = (type, token) => {
    console.log("handleTokenSelection:type/token:", type, "/", token);
    if (type === "input") {
      console.log(
        "handleTokenSelection/setInputToken inputToken/outputToken",
        inputToken,
        outputToken
      );

      setInputToken(token);
    } else {
      console.log(
        "handleTokenSelection/setOutputToken inputToken/outputToken",
        inputToken,
        outputToken
      );
      setOutputToken(token);
    }
    console.log(
      "handleTokenSelection inputToken/outputToken",
      inputToken,
      outputToken
    );
    if (inputToken && outputToken && inputToken !== outputToken) {
      setPath([symbols.get(inputToken), symbols.get(outputToken)]);
    }
    if (inputToken && outputToken && inputToken === outputToken) {
      setPath([]);
      // You can also set a state for the alert message to give users more context
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

  // Effect to update the path whenever inputToken or outputToken changes
  useEffect(() => {
    if (inputToken && outputToken && inputToken !== outputToken) {
      setPath([symbols.get(inputToken), symbols.get(outputToken)]);
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
        let calculatedOutputAmount = ethers.formatUnits(
          fetchBestDealResult[0],
          18
        ); // Convert the result to a human-readable format
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
      <SwapContainer>
        <TokenInfoContainer>
          <InputField
            type="text"
            placeholder="0"
            min="0.0"
            onChange={handleInputChange}
            disabled={!outputToken || !inputToken}
          />
          <StyledDropdown
            onSelect={(token) => handleTokenSelection("input", token)}
          >
            <Dropdown.Toggle>
              {inputToken ? inputToken : "Select token"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {Array.from(symbols).map(([symbol, address]) => (
                <Dropdown.Item key={address} eventKey={symbol}>
                  {symbol}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </StyledDropdown>
        </TokenInfoContainer>

        <TokenInfoContainer>
          <InputField
            type="text"
            placeholder="0"
            min="0.0"
            value={outputAmount === 0 ? "" : outputAmount}
            disabled={true} // to conditionally disable, replace true with condition
          />
          <StyledDropdown
            onSelect={(token) => handleTokenSelection("output", token)}
          >
            <Dropdown.Toggle>
              {outputToken ? outputToken : "Select token"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {Array.from(symbols).map(([symbol, address]) => (
                <Dropdown.Item key={address} eventKey={symbol}>
                  {symbol}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </StyledDropdown>
        </TokenInfoContainer>

        <ExchangeRateText>Exchange Rate: {price}</ExchangeRateText>

        {account ? (
          isSwapping ? (
            <SwapButton variant="primary" disabled>
              <Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
              />{" "}
              Swapping ...
            </SwapButton>
          ) : (
            <SwapButton onClick={swapHandler}>Swap</SwapButton>
          )
        ) : (
          <SwapButton onClick={connectHandler}>Connect Wallet</SwapButton>
        )}
      </SwapContainer>
      {isSwapping ? (
        <Alert
          message={"Swap pending..."}
          transactionHash={null}
          variant={"info"}
          setShowAlert={setShowAlert}
        />
      ) : isSuccess && showAlert ? (
        <Alert
          message={"Swap Successful"}
          transactionHash={transactionHash}
          variant={"success"}
          setShowAlert={setShowAlert}
        />
      ) : !isSuccess && showAlert ? (
        <Alert
          message={"Swap Failed"}
          transactionHash={null}
          variant={"danger"}
          setShowAlert={setShowAlert}
        />
      ) : null}
    </Container>
  );
};

export default Swap;
