import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Container } from "react-bootstrap";
import { ContractsProvider } from "./ContractContext";
import styles from "../styles/App.module.css";
import "../styles/App.css";

import Navigation from "./Navigation";
import Transactions from "./Transactions";
//import Swap from "./Swap";
import Swap from "./AntSwap"

// import { useConnect, useAccount } from "wagmi";
// import { MetaMaskConnector } from "wagmi/connectors/metaMask";



// Components

function App() {
  // const { address, isConnected } = useAccount();
  // const { connect } = useConnect({
  //   connector: new MetaMaskConnector(),
  // });
  return (
    // <div className="App">
    /* <Header connect={connect} isConnected={isConnected} address={address} /> */
    /* <div className="mainWindow"> */
    <ContractsProvider>
      <Container fluid className={styles.container}>
        <Router>
          <Navigation />
          <Routes>
            <Route path="/swap" element={<Swap />} />
            {/* <Route path="/" element={<Swap isConnected={isConnected} address={address} />} /> */}
            <Route path="/trx" element={<Transactions />} />
            <Route path="*" element={<Navigate to="/swap" />} />
          </Routes>
        </Router>
      </Container>
    </ContractsProvider>
    // </div>
    // </div>
  );
}

export default App;
