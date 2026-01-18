//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UTMCoin
 * @dev ERC20 token with a faucet mechanism for new users
 *      Each new user can register and claim 1000 UTMCoin (one-time)
 *      Uses 12 decimals for Polkadot Asset Hub compatibility
 */
contract UTMCoin is ERC20, Ownable {
    // Track which addresses have claimed their free coins
    mapping(address => bool) public hasClaimed;

    // Event emitted when a user claims their coins
    event UserRegistered(address indexed user, uint256 amount);

    /**
     * @dev Constructor initializes the token with name and symbol
     * @param _owner The address that will own this contract (admin)
     */
    constructor(address _owner) ERC20("UTMCoin", "UTM") Ownable(_owner) {
        // Minting is done dynamically via register() function
    }

    /**
     * @dev Allows a new user to register and claim 1000 UTMCoin
     *      Each address can only claim once
     */
    function register() public {
        require(!hasClaimed[msg.sender], "Already claimed free coins");

        // Mark as claimed first to prevent reentrancy
        hasClaimed[msg.sender] = true;

        // Mint 1000 tokens with 12 decimals (1000 * 10^12)
        uint256 freeAmount = 1000 * 10**12;
        _mint(msg.sender, freeAmount);

        emit UserRegistered(msg.sender, freeAmount);
    }

    /**
     * @dev Allows the owner to mint additional tokens if needed
     *      (for future expansion or airdrops)
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint (in 12 decimal format)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Get the decimals for this token
     * @return The number of decimals (12 for Polkadot)
     */
    function decimals() public pure override returns (uint8) {
        return 12;
    }
}
