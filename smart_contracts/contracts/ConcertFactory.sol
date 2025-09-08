// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Concert.sol";

contract ConcertFactory {
    address[] public allConcerts;

    event ConcertCreated(address indexed concertAddress, string name);

    function createConcert(
        uint256 maxTickets,
        uint256 ticketPrice,
        string memory concertName
    ) public returns (address) {
        concert newConcert = new concert(maxTickets, ticketPrice, concertName, msg.sender);
        allConcerts.push(address(newConcert));
        emit ConcertCreated(address(newConcert), concertName);
        return address(newConcert);
    }

    function getAllConcerts() public view returns (address[] memory) {
        return allConcerts;
    }
}