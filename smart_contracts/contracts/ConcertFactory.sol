// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Concert.sol";

contract ConcertFactory {
    address[] public allConcerts;

    event ConcertCreated(address indexed concertAddress, string name, uint256 concertTime, string baseCID);

    function createConcert(
        uint256 maxTickets,
        uint256 ticketPrice,
        string memory concertName,
        uint256 concertTime,
        string memory baseCID
    ) public returns (address) {
        concert newConcert = new concert(
            maxTickets,
            ticketPrice,
            concertName,
            msg.sender,
            concertTime,
            baseCID
        );
        allConcerts.push(address(newConcert));
        emit ConcertCreated(address(newConcert), concertName, concertTime, baseCID); 
        return address(newConcert);
    }

    function getAllConcerts() public view returns (address[] memory) {
        return allConcerts;
    }
}