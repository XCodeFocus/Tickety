import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ConcertFactoryABI from "../contract/ConcertFactoryABI.json";
import ConcertABI from "../contract/ConcertABI.json";

const FACTORY_ADDRESS = "0x5c6bE22B7B5db415d942a2E42a388eBa3cB0F397";

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasMetaMask, setHasMetaMask] = useState(
    Boolean(typeof window !== "undefined" && window.ethereum)
  );
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState("");

  // fetch tickets for connected user
  const fetchMyTickets = async (addr) => {
    setErrorMsg("");
    setLoading(true);
    try {
      // use wallet provider when connected
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddr = addr || (await signer.getAddress());
      setUserAddress(userAddr);

      const code = await provider.getCode(FACTORY_ADDRESS);
      if (!code || code === "0x") {
        setTickets([]);
        setLoading(false);
        return;
      }

      const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        ConcertFactoryABI,
        provider
      );

      let addresses = [];
      try {
        const raw = await factory.getAllConcerts();
        addresses = Array.isArray(raw)
          ? raw.map(String)
          : Object.values(raw).map(String);
      } catch {
        addresses = [];
      }

      const allTickets = [];

      for (const contractAddress of addresses) {
        try {
          const contract = new ethers.Contract(
            contractAddress,
            ConcertABI,
            provider
          );

          // 先嘗試 tokensOfOwner，若不存在用 balance + tokenOfOwnerByIndex
          let tokenIds = [];
          try {
            const raw = await contract.tokensOfOwner(userAddr);
            if (Array.isArray(raw)) tokenIds = raw.map((v) => v.toString());
            else tokenIds = Object.values(raw).map((v) => v.toString());
          } catch {
            // fallback
            try {
              const balance = await contract.balanceOf(userAddr);
              const n = Number(balance?.toString?.() ?? balance) || 0;
              for (let i = 0; i < n; i++) {
                try {
                  const tid = await contract.tokenOfOwnerByIndex(userAddr, i);
                  tokenIds.push(tid.toString());
                } catch {
                  // ignore per-index failures
                }
              }
            } catch {
              // ignore
            }
          }

          for (const id of tokenIds) {
            try {
              // 取得 tokenURI 並 fetch metadata
              const tokenParam = (() => {
                try {
                  return BigInt(String(id).replace(/n$/i, ""));
                } catch {
                  return String(id);
                }
              })();

              const tokenURI = await contract.tokenURI(tokenParam);
              if (typeof tokenURI !== "string") continue;

              let metadataUrl = tokenURI;
              if (metadataUrl.startsWith("ipfs://")) {
                metadataUrl =
                  "https://senior-brown-chameleon.myfilebase.com/ipfs/" +
                  metadataUrl.replace("ipfs://", "");
              } else {
                // 確保 filename 為 id.json（簡單處理）
                const parts = metadataUrl.split("/");
                const last = parts[parts.length - 1] || "";
                const cleanId = String(id).replace(/n$/i, "");
                if (!new RegExp(`^${cleanId}(?:\\.json)?$`).test(last)) {
                  parts[parts.length - 1] = `${cleanId}.json`;
                  metadataUrl = parts.join("/");
                }
              }

              const res = await fetch(metadataUrl);
              if (!res.ok) continue;
              const contentType = res.headers.get("content-type") || "";
              if (!contentType.includes("application/json")) continue;
              const metadata = await res.json();

              allTickets.push({
                tokenId: String(id).replace(/n$/i, ""),
                contractAddress,
                ...metadata,
              });
            } catch {
              // ignore single token errors
            }
          }
        } catch {
          // ignore contract-level errors
        }
      }

      setTickets(allTickets);
    } catch (err) {
      setErrorMsg(err.message || String(err));
      setTickets([]);
    }
    setLoading(false);
  };

  // check metamask presence and connection state on mount
  useEffect(() => {
    const mm = Boolean(typeof window !== "undefined" && window.ethereum);
    setHasMetaMask(mm);
    if (!mm) {
      setWalletConnected(false);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts && accounts.length > 0) {
          setWalletConnected(true);
          setUserAddress(accounts[0]);
          // auto-fetch when already connected
          await fetchMyTickets(accounts[0]);
        } else {
          setWalletConnected(false);
          setLoading(false);
        }
      } catch (e) {
        setWalletConnected(false);
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    if (!window.ethereum) {
      setHasMetaMask(false);
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts && accounts.length > 0) {
        setWalletConnected(true);
        await fetchMyTickets(accounts[0]);
      }
    } catch (err) {
      setErrorMsg(err?.message || String(err));
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="my-tickets p-4">
        <h2 className="text-xl font-bold mb-4">🎟 My Tickets</h2>

        {/* MetaMask not installed */}
        {!hasMetaMask && (
          <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500">
            <div className="text-sm mb-2">
              MetaMask is not installed. Please install MetaMask to connect your
              wallet.
            </div>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Install MetaMask
            </a>
          </div>
        )}

        {/* MetaMask installed but not connected */}
        {hasMetaMask && !walletConnected && (
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400">
            <div className="text-sm mb-2">
              Connect your MetaMask wallet to view your tickets.
            </div>
            <button
              onClick={handleConnect}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {loading && <p>Loading your tickets...</p>}
        {!loading && errorMsg && (
          <p className="text-red-600">Error: {errorMsg}</p>
        )}
        {!loading && tickets.length === 0 && !errorMsg && walletConnected && (
          <p>No tickets found.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.contractAddress + "-" + ticket.tokenId}
              className="border rounded p-4 shadow bg-white"
            >
              <p className="font-semibold">Token ID: {ticket.tokenId}</p>
              <p>Event: {ticket.name}</p>
              <p>Contract: {ticket.contractAddress}</p>
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
      <Footer />
    </div>
  );
}

export default Tickets;
