pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract LyraToken is MintableToken {
  string public constant name = "Lyra Token";
  string public constant symbol = "LYRA";
  uint8 public constant decimals = 18;
}