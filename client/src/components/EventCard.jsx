import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import ConcertABI from "../contract/ConcertABI.json";
import { METADATA_GATEWAY } from "../config";
import { formatError } from "../utils/errors";
import { useToast } from "./Toast";

const CID_MAP_KEY = "concertCidMap";

function buildTokenURI(base, tokenId) {
  const idStr = String(tokenId);
  if (!base) throw new Error("Base CID/path is empty");
  let b = base.trim();
  // Strip ipfs:// prefix if present
  if (/^ipfs:\/\//i.test(b)) b = b.replace(/^ipfs:\/\//i, "");
  // HTTP(S) full path case
  if (/^https?:\/\//i.test(b)) {
    if (!b.endsWith("/")) b += "/";
    return b + idStr + ".json";
  }
  // Remove leading slashes for CID/path form
  b = b.replace(/^\/+/, "");
  if (!b.endsWith("/")) b += "/";
  return METADATA_GATEWAY + b + idStr + ".json";
}

function EventCard({ event, onBought, onDelete }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState("");

  // check if is owner, and get owner address
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
        setOwnerAddress(owner);
        setIsOwner(owner.toLowerCase() === signer.address.toLowerCase());
      } catch (err) {
        setIsOwner(false);
        setOwnerAddress("");
      }
    }
    checkOwner();
  }, [event?.address]);

  const handleBuy = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask is not installed.");
      return;
    }
    setLoading(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(event.address, ConcertABI, signer);

      const ID = prompt("Enter your ID number:");
      if (!ID) {
        toast.info("Purchase cancelled.");
        setLoading(false);
        return;
      }

      // bind ID first, ignore "already registered" error
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

      const max = Number(event.maxTickets);
      const sold = Number(event.ticketId);
      const ticketId = sold + 1;

      // obtain base CID: prefer event.cid (populated from on-chain), fallback to legacy localStorage prompt
      let baseCid = event.cid;
      if (!baseCid) {
        try {
          const map = JSON.parse(localStorage.getItem(CID_MAP_KEY) || "{}");
          baseCid = map[event.address];
        } catch {
          baseCid = undefined;
        }
      }
      if (!baseCid) {
        baseCid = prompt(
          "Legacy concert: enter metadata CID (Qm... or bafy...) "
        );
        if (!baseCid) {
          toast.info("Purchase cancelled (CID missing).");
          setLoading(false);
          return;
        }
        try {
          const map = JSON.parse(localStorage.getItem(CID_MAP_KEY) || "{}");
          map[event.address] = baseCid.trim();
          localStorage.setItem(CID_MAP_KEY, JSON.stringify(map));
          event.cid = baseCid.trim();
        } catch (e) {
          console.warn("Failed to store legacy CID", e);
        }
      }

      const tokenURI = buildTokenURI(baseCid, ticketId);
      const priceStr =
        typeof event.price === "string" ? event.price : String(event.price);
      const buyer = await signer.getAddress();

      const tx = await contract.buyTicket(buyer, tokenURI, ID, {
        value: ethers.parseEther(priceStr),
      });
      await tx.wait();

      toast.success("Successfully bought ticket");
      if (onBought) onBought();
    } catch (err) {
      console.error(err);
      toast.error(formatError(err));
    }
    setLoading(false);
  };

  const handleStartSale = async () => {
    setStartLoading(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(event.address, ConcertABI, signer);

      const owner = await contract.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        toast.warn("Only the contract owner can start the sale");
        setStartLoading(false);
        return;
      }

      const tx = await contract.startSale();
      await tx.wait();
      toast.success("Sale started");
      if (onBought) onBought();
    } catch (err) {
      console.error(err);
      toast.error(formatError(err));
    }
    setStartLoading(false);
  };

  const handleEndSale = async () => {
    setEndLoading(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(event.address, ConcertABI, signer);

      const owner = await contract.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        toast.warn("Only the contract owner can end the sale");
        setEndLoading(false);
        return;
      }

      const tx = await contract.endSale();
      await tx.wait();
      toast.success("Sale ended");
      if (onBought) onBought();
    } catch (err) {
      console.error(err);
      toast.error(formatError(err));
    }
    setEndLoading(false);
  };

  const handleWithdraw = async () => {
    setWithdrawLoading(true);
    try {
      if (!window.ethereum) {
        toast.error("MetaMask is not installed.");
        setWithdrawLoading(false);
        return;
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const contract = new ethers.Contract(event.address, ConcertABI, signer);

      const owner = await contract.owner();
      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        toast.warn("Only the contract owner can withdraw funds");
        setWithdrawLoading(false);
        return;
      }

      const tx = await contract.withdraw();
      await tx.wait();
      toast.success("Withdraw successful");
    } catch (err) {
      console.error(err);
      toast.error(formatError(err));
    }
    setWithdrawLoading(false);
  };

  const truncate = (addr) =>
    typeof addr === "string" && addr.length > 10
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr || "";

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 truncate">
          {event.name}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              event.saleActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {event.saleActive ? "On Sale" : "Not Started"}
          </span>
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-gray-600 underline"
            onClick={() => onDelete(event.address)}
          >
            Hide
          </button>
        </div>
      </div>

      <div className="mt-1 text-sm text-gray-600 space-y-1">
        <div className="flex items-center justify-between">
          <span>Price</span>
          <span className="font-medium text-gray-900">{event.price} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Time</span>
          <span>
            {event.time ? new Date(event.time).toLocaleString() : "N/A"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Remaining</span>
          <span className="font-medium">{event.remain}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Contract</span>
          <code className="font-mono text-xs">{truncate(event.address)}</code>
        </div>
        {ownerAddress && (
          <div className="flex items-center justify-between">
            <span>Deployer</span>
            <code className="font-mono text-xs">{truncate(ownerAddress)}</code>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`px-4 py-2 rounded text-white text-sm transition w-full sm:w-auto ${
            event.saleActive
              ? "bg-indigo-600 hover:bg-indigo-500"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={handleBuy}
          disabled={loading || event.remain === "0" || !event.saleActive}
        >
          {loading
            ? "Buying..."
            : event.remain === "0"
            ? "Sold out"
            : !event.saleActive
            ? "Sale not started"
            : "Buy Ticket"}
        </button>

        {isOwner && (
          <>
            <button
              type="button"
              className={`px-3 py-2 rounded text-white text-sm transition w-full sm:w-auto ${
                !event.saleActive
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={handleStartSale}
              disabled={startLoading || event.saleActive}
            >
              {startLoading ? "Starting..." : "Start sale"}
            </button>
            <button
              type="button"
              className={`px-3 py-2 rounded text-white text-sm transition w-full sm:w-auto ${
                event.saleActive
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={handleEndSale}
              disabled={endLoading || !event.saleActive}
            >
              {endLoading ? "Ending..." : "End sale"}
            </button>
            <button
              type="button"
              className={`px-3 py-2 rounded text-white text-sm transition w-full sm:w-auto ${
                withdrawLoading
                  ? "opacity-50 pointer-events-none bg-yellow-500"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }`}
              onClick={async () => {
                await handleWithdraw();
              }}
              disabled={withdrawLoading}
            >
              {withdrawLoading ? "Withdrawing..." : "Withdraw"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default EventCard;
