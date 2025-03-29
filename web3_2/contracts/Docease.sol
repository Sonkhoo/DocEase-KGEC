// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import OpenZeppelin's ERC20 implementation
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Docease is ERC20, Ownable {
    // Faucet request cooldown period (24 hours in seconds)
    uint256 public constant FAUCET_COOLDOWN = 86400;
    
    // Amount of tokens to distribute per faucet request
    uint256 public faucetAmount;
    
    // Mapping to track last faucet request timestamp for each address
    mapping(address => uint256) public lastFaucetRequest;

    // Constructor: Initialize the token with a name, symbol, and initial supply
    constructor() ERC20("DOCEASE", "DOC") Ownable(msg.sender) {
        // Mint 1,000,000 tokens to the deployer's address
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
        
        // Set default faucet amount to 100 tokens
        faucetAmount = 100 * (10 ** uint256(decimals()));
    }

    // Faucet function to distribute tokens to users
    function requestFaucet() public {
        require(block.timestamp >= lastFaucetRequest[msg.sender] + FAUCET_COOLDOWN, "Faucet: Please wait 24 hours between requests");
        require(balanceOf(owner()) >= faucetAmount, "Faucet: Insufficient tokens in faucet");
        
        // Update the last request timestamp
        lastFaucetRequest[msg.sender] = block.timestamp;
        
        // Transfer tokens from contract owner to the requester
        _transfer(owner(), msg.sender, faucetAmount);
    }
    
    // Allow owner to set the faucet distribution amount
    function setFaucetAmount(uint256 newAmount) public onlyOwner {
        faucetAmount = newAmount;
    }
    
    // Override the `transfer` function (optional, for additional functionality)
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        // Call the parent ERC20 `transfer` function
        super.transfer(recipient, amount);
        return true;
    }

    // Override the `approve` function (optional, for additional functionality)
    function approve(address spender, uint256 amount) public override returns (bool) {
        // Call the parent ERC20 `approve` function
        super.approve(spender, amount);
        return true;
    }

    // Override the `transferFrom` function (optional, for additional functionality)
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        // Call the parent ERC20 `transferFrom` function
        super.transferFrom(sender, recipient, amount);
        return true;
    }

    // Additional utility function to check the balance of an address
    function getBalance(address account) public view returns (uint256) {
        return balanceOf(account);
    }

    // Additional utility function to check the allowance granted to a spender
    function getAllowance(address owner, address spender) public view returns (uint256) {
        return allowance(owner, spender);
    }
    
    // Check when an address can request from the faucet again
    function nextFaucetAvailable(address user) public view returns (uint256) {
        uint256 nextAvailable = lastFaucetRequest[user] + FAUCET_COOLDOWN;
        if (nextAvailable <= block.timestamp) {
            return 0; // Available now
        }
        return nextAvailable; // Timestamp when it will be available
    }
}