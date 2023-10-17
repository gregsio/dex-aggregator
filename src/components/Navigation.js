import { useSelector, useDispatch } from "react-redux";
import Blockies from "react-blockies";
import Navbar from "react-bootstrap/Navbar";
import { Button } from "react-bootstrap";
import Dropdown from "react-bootstrap/Dropdown";

import styles from "../styles/Theme.module.css";
import logo from "../img/logo.png";
import localhostIcon from "../img/icons8-local-network-32.png";
import sepoliaIcon from "../img/sepolia.png";
import ethereumIcon from "../img/ethereum.png";

import { loadAccount } from "../store/interactions";
import Tabs from "./Tabs";

const Navigation = () => {
  const account = useSelector((state) => state.provider.account);
  const chainId = useSelector((state) => state.provider.chainId);
  const dispatch = useDispatch();

  const connectHandler = async () => {
    await loadAccount(dispatch);
  };

  const networkHandler = async (e) => {
    console.log("networkHandler", e);
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: e }],
    });
  };

  const getNetworkIcon = (chainId) => {
    console.log("chainId", chainId);
    switch (chainId) {
      case "0x31337":
        return localhostIcon;
      case "0xaa36a7":
        return sepoliaIcon;
      case "0x1":
        return ethereumIcon;
      default:
        return null;
    }
  };

  const currentNetworkIcon = getNetworkIcon(
    chainId ? `0x${chainId.toString(16)}` : `0`
  );

  return (
    <Navbar className={styles.customNavbar} expand="lg">
      <Navbar.Brand className="mx-auto navBrand">
        <img
          alt="logo"
          src={logo}
          width="40"
          height="40"
          className={`d-inline-block align-top ${styles.navLogo}`}
        />
      </Navbar.Brand>
      <Tabs />
      <Navbar.Collapse className="justify-content-end">
        <Dropdown onSelect={networkHandler}>
          <Dropdown.Toggle variant="secondary" id="dropdown-basic">
            {currentNetworkIcon ? (
              <img
                src={currentNetworkIcon}
                alt="Current Network Icon"
                width="20"
              />
            ) : (
              "Select Network"
            )}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item eventKey="0x7A69">
              <img src={localhostIcon} alt="Localhost Icon" width="20" />{" "}
              Localhost
            </Dropdown.Item>
            {/* <Dropdown.Item eventKey="0xaa36a7">
                      <img src={sepoliaIcon} alt="Sepolia Icon" width="20" /> Sepolia
                  </Dropdown.Item> */}
            <Dropdown.Item eventKey="0x1">
              <img src={ethereumIcon} alt="Ethereum Icon" width="20" /> Ethereum
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        {account ? (
          <Navbar.Text className={styles.accountInfo}>
            <Blockies
              seed={account}
              size={10}
              scale={3}
              color="#2187D0"
              bgColor="#F1F2F9"
              spotColor="#767F92"
              className="identicon mx-2"
            />
            {account.slice(0, 6) + "..." + account.slice(38, 42)}
          </Navbar.Text>
        ) : (
          <Button className={styles.connectBtn} onClick={connectHandler}>
            Connect
          </Button>
        )}
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Navigation;
