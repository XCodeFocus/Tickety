// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract concert is ERC721URIStorage, Ownable {
    uint256 public ticketId;
    uint256 public maxTickets;
    uint256 public ticketPrice;
    uint256 public concertTime; 

    bool public saleActive;

    mapping(address => bool) public hasTicket;
    mapping(string => address) public idToAccount;
    mapping(address => string) private accountToId;
    mapping(string => bool) private idIsRegistered;
    mapping(address => bool) private accountIsRegistered;

    // constructor with maxTicket and price initialization
    constructor(
        uint256 _maxTickets,
        uint256 _ticketPrice,
        string memory _concertName,
        address _owner,
        uint256 _concertTime 
    ) ERC721(_concertName, "TCK") Ownable(_owner) {
        ticketId = 0;
        maxTickets = _maxTickets;
        ticketPrice = _ticketPrice;
        saleActive = false;
        concertTime = _concertTime; 
    }

    // override _update from ERC721.sol to prohibit transfer
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to != address(0), "Cannot be transfered");

        return super._update(to, tokenId, auth);
    }

    // bind the account and personal ID number
    function binding(string memory _IDNumber) public {
        require(!idIsRegistered[_IDNumber], "yout ID is already registered");
        require(
            !accountIsRegistered[msg.sender],
            "yout account is already registered"
        );
        idToAccount[_IDNumber] = msg.sender;
        accountToId[msg.sender] = _IDNumber;
        idIsRegistered[_IDNumber] = true;
        accountIsRegistered[msg.sender] = true;
    }

    function startSale() public onlyOwner {
        saleActive = true;
    }

    function endSale() public onlyOwner {
        saleActive = false;
    }
    
    // get all token IDs owned by an address
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
    uint256 count = balanceOf(owner);
    uint256[] memory result = new uint256[](count);
    uint256 idx = 0;
    for (uint256 i = 1; i <= ticketId; i++) {
        if (_ownerOf(i) == owner) {
            result[idx] = i;
            idx++;
        }
    }
    return result;
}

    // buy ticket from supplier
    function buyTicket(
        address buyer,
        string memory tokenURI,
        string memory ID
    ) public payable {
        require(saleActive, "sale hasn't begin");
        require(ticketId < maxTickets, "All tickets have been sold");
        require(idIsRegistered[ID], "This ID is not registered");
        require(
            idToAccount[ID] == buyer,
            "This ID is not using the binded registered account"
        );
        require(!hasTicket[buyer], "You already own a ticket");
        require(msg.value >= ticketPrice, "Not enough Ether sent");
        require(msg.value == ticketPrice, "too much Ether sent");

        ticketId += 1;
        _safeMint(buyer, ticketId);
        _setTokenURI(ticketId, tokenURI);
        hasTicket[buyer] = true;
    }

    // withdraw balance from contract
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
