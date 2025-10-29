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

        // 嘗試 tokensOfOwner，若無則使用 balanceOf + tokenOfOwnerByIndex
        let tokenIds = [];
        try {
          const rt = await contract.tokensOfOwner(userAddress);
          if (Array.isArray(rt)) tokenIds = rt.map((v) => v.toString());
          else tokenIds = Object.values(rt || {}).map((v) => v.toString());
        } catch {
          try {
            const balance = await contract.balanceOf(userAddress);
            const n = Number(balance?.toString?.() ?? balance) || 0;
            for (let i = 0; i < n; i++) {
              try {
                const tid = await contract.tokenOfOwnerByIndex(userAddress, i);
                tokenIds.push(tid.toString());
              } catch {
                // ignore per-index failures
              }
            }
          } catch {
            // ignore
          }
        }

        const ticketData = [];
        for (const rawId of tokenIds) {
          try {
            const cleanId = String(rawId).replace(/n$/i, "");
            let tokenParam;
            try {
              tokenParam = BigInt(cleanId);
            } catch {
              tokenParam = cleanId;
            }

            const tokenURI = await contract.tokenURI(tokenParam);
            if (typeof tokenURI !== "string") continue;

            let metadataUrl = tokenURI;
            if (metadataUrl.startsWith("ipfs://")) {
              metadataUrl =
                "https://senior-brown-chameleon.myfilebase.com/ipfs/" +
                metadataUrl.replace("ipfs://", "");
            } else {
              const parts = metadataUrl.split("/");
              const last = parts[parts.length - 1] || "";
              if (!new RegExp(`^${cleanId}(?:\\.json)?$`).test(last)) {
                parts[parts.length - 1] = `${cleanId}.json`;
                metadataUrl = parts.join("/");
              }
            }

            const res = await fetch(metadataUrl);
            if (!res.ok) continue;
            const ct = res.headers.get("content-type") || "";
            if (!ct.includes("application/json")) continue;
            const metadata = await res.json();

            ticketData.push({
              tokenId: cleanId,
              ...metadata,
            });
          } catch {
            // ignore single token errors
          }
        }

        setTickets(ticketData);
      } catch (err) {
        console.error("Error loading tickets:", err);
        setTickets([]);
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
                    ? "https://senior-brown-chameleon.myfilebase.com/ipfs/" +
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
