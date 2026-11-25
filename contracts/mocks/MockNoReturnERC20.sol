// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

/// @dev Test token whose transfer, transferFrom and approve return no value (USDT style).
/// Like USDT, approve reverts when changing a non-zero allowance to another non-zero value.
contract MockNoReturnERC20 {
    string public name = "No Return Token";
    string public symbol = "NRT";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address _to, uint256 _amount) external {
        balanceOf[_to] += _amount;
        totalSupply += _amount;
    }

    function approve(address _spender, uint256 _amount) external {
        require(
            _amount == 0 || allowance[msg.sender][_spender] == 0,
            "Reset allowance first"
        );
        allowance[msg.sender][_spender] = _amount;
    }

    function transfer(address _to, uint256 _amount) external {
        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
    }

    function transferFrom(address _from, address _to, uint256 _amount) external {
        allowance[_from][msg.sender] -= _amount;
        balanceOf[_from] -= _amount;
        balanceOf[_to] += _amount;
    }
}
