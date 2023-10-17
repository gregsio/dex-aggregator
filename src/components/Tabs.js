import React from "react";
import { useLocation } from "react-router-dom";
import Nav from "react-bootstrap/Nav";
import { LinkContainer } from "react-router-bootstrap";
import styles from "../styles/Theme.module.css";

const Tabs = () => {
  const location = useLocation();
  return (
    <Nav>
      <LinkContainer to="/swap">
        <Nav.Link
          className={
            location.pathname === "/swap"
              ? `${styles.tabLink} ${styles.active}`
              : styles.tabLink
          }
        >
          Swap
        </Nav.Link>
      </LinkContainer>

      <LinkContainer to="/trx">
        <Nav.Link
          className={
            location.pathname === "/trx"
              ? `${styles.tabLink} ${styles.active}`
              : styles.tabLink
          }
        >
          Transactions
        </Nav.Link>
      </LinkContainer>
    </Nav>
  );
};

export default Tabs;
