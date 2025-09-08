import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import ConcertABI from "../contract/ConcertABI.json";

function EventCard({ event, onBought, onDelete }) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState(""); // 新增

  // 檢查目前帳號是否為 owner，並取得 owner address
  useEffect(() => {
    async function checkOwner() {
      if (!window.ethereum || !event?.address) return;
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          event.address,
          ConcertABI,
          provider
        );
        const owner = await contract.owner();
        setOwnerAddress(owner); // 儲存 owner address
        setIsOwner(owner.toLowerCase() === signer.address.toLowerCase());
      } catch (err) {
        setIsOwner(false);
        setOwnerAddress("");
      }
    }
    checkOwner();
    // eslint-disable-next-line
  }, [event?.address]);

  const handleBuy = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask first");
      return;
    }
    setLoading(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(event.address, ConcertABI, signer);

      const ID = prompt("Enter your ID number:");
      if (!ID) throw new Error("ID number is required");

      // 先綁定身份證字號與帳號（如果已綁定會失敗，可忽略錯誤）
      try {
        const txBind = await contract.binding(ID);
        await txBind.wait();
      } catch (err) {
        if (
          !(
            err?.message?.includes("already registered") ||
            err?.error?.message?.includes("already registered")
          )
        ) {
          throw err;
        }
      }

      const tokenURI = "https://your-metadata-url/" + ID; // 或用空字串 ""
      const priceStr =
        typeof event.price === "string" ? event.price : String(event.price);
      const buyer = await signer.getAddress();

      const tx = await contract.buyTicket(buyer, tokenURI, ID, {
        value: ethers.parseEther(priceStr),
      });
      await tx.wait();

      alert("Successfully bought ticket");
      if (onBought) onBought();
    } catch (err) {
      console.error(err);
      alert("Failed to buy tickets" + (err?.message || err));
    }
    setLoading(false);
  };

  const handleStartSale = async () => {
    setActionLoading(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(event.address, ConcertABI, signer);

      const owner = await contract.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        alert("Only the contract owner can start the sale");
        setActionLoading(false);
        return;
      }

      const tx = await contract.startSale();
      await tx.wait();
      alert("Sale started");
      if (onBought) onBought();
    } catch (err) {
      console.error(err);
      alert("Failed to start sale" + (err?.reason || err?.message || err));
    }
    setActionLoading(false);
  };

  const handleEndSale = async () => {
    setActionLoading(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(event.address, ConcertABI, signer);

      const owner = await contract.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        alert("Only the contract owner can end the sale");
        setActionLoading(false);
        return;
      }

      const tx = await contract.endSale();
      await tx.wait();
      alert("Sale ended");
      if (onBought) onBought();
    } catch (err) {
      console.error(err);
      alert("Failed to end sale" + (err?.reason || err?.message || err));
    }
    setActionLoading(false);
  };

  return (
    <div className="event-card border p-4 m-4 rounded">
      <h2 className="text-xl font-bold">{event.name}</h2>
      <p>Contract address: {event.address}</p>
      <p>Deployer address: {ownerAddress}</p>
      <p>Price: {event.price} ETH</p>
      <p>Time: {event.time ? new Date(event.time).toLocaleString() : "N/A"}</p>
      <p>Remaining tickets: {event.remain}</p>
      <p>
        Status:
        <span className={event.saleActive ? "text-green-600" : "text-gray-500"}>
          {event.saleActive ? " Sale has begun" : " Sale has not started yet"}
        </span>
      </p>
      <button
        className={`mt-2 px-4 py-2 rounded text-white transition
    ${
      event.saleActive
        ? "bg-blue-500 hover:bg-blue-600"
        : "bg-gray-400 cursor-not-allowed"
    }
  `}
        onClick={handleBuy}
        disabled={loading || event.remain === "0" || !event.saleActive}
      >
        {loading
          ? "buying..."
          : event.remain === "0"
          ? "Sold out"
          : !event.saleActive
          ? "Sale not started"
          : "Buy Ticket"}
      </button>
      {isOwner && (
        <div className="flex gap-2 mt-2">
          <button
            className={`px-3 py-1 rounded text-white transition ${
              !event.saleActive
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={handleStartSale}
            disabled={actionLoading || event.saleActive}
          >
            Start sale
          </button>
          <button
            className={`px-3 py-1 rounded text-white transition ${
              event.saleActive
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={handleEndSale}
            disabled={actionLoading || !event.saleActive}
          >
            End sale
          </button>
          <button
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
            onClick={() => onDelete(event.address)}
          >
            Hide Event
          </button>
        </div>
      )}
    </div>
  );
}
export default EventCard;
