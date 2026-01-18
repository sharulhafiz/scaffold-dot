//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UTMStore
 * @dev Marketplace contract for selling UTM merchandise using UTMCoin
 *      Product metadata (names, images) is stored off-chain
 *      Only prices and availability are stored on-chain
 */
contract UTMStore is Ownable {
    // The UTMCoin token used for payments
    IERC20 public immutable token;

    // Product structure - stores on-chain data only
    struct Product {
        uint256 price;      // Price in UTMCoin (12 decimals)
        bool isActive;      // Whether the product is available for purchase
    }

    // Mapping of product IDs to product data
    mapping(uint256 => Product) public products;

    // Track total purchases (for analytics)
    uint256 public totalPurchases;
    uint256 public totalRevenue;

    // Event emitted when an item is purchased
    event ItemPurchased(
        address indexed buyer,
        uint256 indexed productId,
        uint256 price,
        uint256 timestamp
    );

    // Event emitted when a product is updated
    event ProductUpdated(
        uint256 indexed productId,
        uint256 price,
        bool isActive,
        address indexed updatedBy
    );

    // Event emitted when admin withdraws tokens
    event TokensWithdrawn(address indexed to, uint256 amount);

    /**
     * @dev Constructor initializes the store with the UTMCoin address
     * @param _tokenAddress Address of the UTMCoin contract
     * @param _owner Address that will own this contract (admin)
     */
    constructor(address _tokenAddress, address _owner) Ownable(_owner) {
        require(_tokenAddress != address(0), "Invalid token address");
        token = IERC20(_tokenAddress);
    }

    /**
     * @dev Allows admin to set or update a product
     * @param productId The product ID (must match off-chain data)
     * @param price The price in UTMCoin (12 decimals)
     * @param isActive Whether the product is available
     */
    function setProduct(uint256 productId, uint256 price, bool isActive) public onlyOwner {
        products[productId] = Product(price, isActive);
        emit ProductUpdated(productId, price, isActive, msg.sender);
    }

    /**
     * @dev Allows users to purchase an item using UTMCoin
     *      User must approve the contract to spend tokens first
     * @param productId The product ID to purchase
     */
    function purchaseItem(uint256 productId) public {
        Product memory product = products[productId];
        require(product.isActive, "Product not available");
        require(product.price > 0, "Invalid product price");

        // Transfer UTMCoin from buyer to this contract
        require(
            token.transferFrom(msg.sender, address(this), product.price),
            "Transfer failed"
        );

        // Update analytics
        totalPurchases += 1;
        totalRevenue += product.price;

        // Emit purchase event
        emit ItemPurchased(msg.sender, productId, product.price, block.timestamp);
    }

    /**
     * @dev Allows admin to withdraw collected UTMCoin tokens
     * @param amount Amount to withdraw (0 to withdraw all)
     */
    function withdraw(uint256 amount) public onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        if (amount == 0) {
            amount = balance;
        }
        require(amount <= balance, "Insufficient balance");

        require(token.transfer(owner(), amount), "Transfer failed");
        emit TokensWithdrawn(owner(), amount);
    }

    /**
     * @dev Get product details
     * @param productId The product ID
     * @return price The price in UTMCoin
     * @return isActive Whether the product is available
     */
    function getProduct(uint256 productId)
        public
        view
        returns (uint256 price, bool isActive)
    {
        Product memory product = products[productId];
        return (product.price, product.isActive);
    }

    /**
     * @dev Get store analytics
     * @return purchases Number of items purchased
     * @return revenue Total revenue in UTMCoin
     * @return contractBalance Current balance in contract
     */
    function getStoreStats()
        public
        view
        returns (
            uint256 purchases,
            uint256 revenue,
            uint256 contractBalance
        )
    {
        return (totalPurchases, totalRevenue, token.balanceOf(address(this)));
    }
}
