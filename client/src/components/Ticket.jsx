import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ConcertABI from "../contract/ConcertABI.json";

function MyTickets({ contractAddress }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTickets() {
      if (!window.ethereum || !contractAddress) return;
      setLoading(true);
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        const contract = new ethers.Contract(
          contractAddress,
          ConcertABI,
          provider
        );

        // query all tickets owned by user
        const balance = await contract.balanceOf(userAddress);

        const ticketData = [];
        for (let i = 0; i < balance; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          const tokenURI = await contract.tokenURI(tokenId);

          // if start with ipfs://, change to https gateway
          let metadataUrl = tokenURI;
          if (metadataUrl.startsWith("ipfs://")) {
            metadataUrl =
              "https://senior-brown-chameleon.myfilebase.com/ipfs/" +
              metadataUrl.replace("ipfs://", "");
          }

          // download metadata.json
          const res = await fetch(metadataUrl);
          const metadata = await res.json();

          ticketData.push({
            tokenId: tokenId.toString(),
            ...metadata,
          });
        }

        setTickets(ticketData);
      } catch (err) {
        console.error("Error loading tickets:", err);
      }
      setLoading(false);
    }

    loadTickets();
  }, [contractAddress]);

  return (
    <div className="my-tickets p-4">
      <h2 className="text-xl font-bold mb-4">🎟 My Tickets</h2>
      {loading && <p>Loading your tickets...</p>}
      {!loading && tickets.length === 0 && <p>No tickets found.</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tickets.map((ticket) => (
          <div
            key={ticket.tokenId}
            className="border rounded p-4 shadow bg-white"
          >
            <p className="font-semibold">Token ID: {ticket.tokenId}</p>
            <p>{ticket.name}</p>
            <p>{ticket.description}</p>
            {ticket.image && (
              <img
                src={
                  ticket.image.startsWith("ipfs://")
                    ? "https://ipfs.filebase.io/ipfs/" +
                      ticket.image.replace("ipfs://", "")
                    : ticket.image
                }
                alt="ticket"
                className="mt-2 rounded"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyTickets;
