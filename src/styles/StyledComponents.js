import styled from 'styled-components';
import Dropdown from 'react-bootstrap/Dropdown';

export const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #12171F;
`;

export const InputField = styled.input`
  width: 60%;
  background: #272F3E;
  border: none;
  border-radius: 10px;
  color: #fff;
  padding: 10px;
  font-size: 16px;
  margin-right: 10px;
  &:focus {
    outline: none;
  }
  ::placeholder {
    color: #a1a4a8;
  }
`;

export const SwapContainer = styled.div`
  width: 400px;
  background: #1D2532;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0px 0px 25px rgba(0, 0, 0, 0.2);
`;

export const TokenInfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const TokenSelector = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #272F3E;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 20px;
`;

export const TokenText = styled.p`
  color: #fff;
  font-size: 18px;
`;

export const StyledDropdown = styled(Dropdown)`
  .dropdown-toggle {
    background-color: #272F3E;
    border: none;
    color: #fff;
    &:focus {
      box-shadow: none;
      outline: none;
    }
  }
`;

export const SwapButton = styled.button`
  width: 100%;
  background-color: #007bbf;
  color: #fff;
  padding: 15px;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 600;

  &:hover {
    background-color: #005f9e;
  }
`;

export const ExchangeRateText = styled.p`
  color: #a1a4a8;
  font-size: 16px;
  text-align: center;
  margin: 20px 0;
  `;