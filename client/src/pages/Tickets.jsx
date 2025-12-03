import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { TicketCard } from "../components/TicketCard";
import ConcertFactoryABI from "../contract/ConcertFactoryABI.json";
import ConcertABI from "../contract/ConcertABI.json";
import { FACTORY_ADDRESS, METADATA_GATEWAY } from "../config";
import { formatError } from "../utils/errors";
import { useToast } from "../components/Toast";

function Tickets() {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasMetaMask, setHasMetaMask] = useState(
    Boolean(typeof window !== "undefined" && window.ethereum)
  );
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState("");

  // fetch tickets for connected user (aggregate across all concert contracts)
  const fetchMyTickets = async (addr) => {
    setErrorMsg("");
    setLoading(true);
    try {
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

          // try tokensOfOwner first, then fallback to balanceOf + tokenOfOwnerByIndex
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
                  METADATA_GATEWAY + metadataUrl.replace("ipfs://", "");
              } else {
                const parts = metadataUrl.split("/");
                const last = parts[parts.length - 1] || "";
                const cleanId = String(id).replace(/n$/i, "");
                if (!new RegExp(`^${cleanId}(?:\\.json)?$`).test(last)) {
                  parts[parts.length - 1] = `${cleanId}.json`;
                  metadataUrl = parts.join("/");
                }
              }

              let metadata = null;
              try {
                const res = await fetch(metadataUrl);
                if (!res.ok) continue;
                try {
                  metadata = await res.json();
                } catch (e) {
                  try {
                    const txt = await res.text();
                    metadata = JSON.parse(txt);
                  } catch (e2) {
                    continue;
                  }
                }
              } catch (e) {
                continue;
              }

              const attrs =
                metadata?.attributes ||
                metadata?.traits ||
                metadata?.properties ||
                metadata?.Attributes ||
                [];

              allTickets.push({
                tokenId: String(id).replace(/n$/i, ""),
                contractAddress,
                ...metadata,
                attributes: attrs,
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
      const msg = formatError(err);
      setErrorMsg(msg);
      toast.error(msg);
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
          // auto-fetch tickets when already connected
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
        setUserAddress(accounts[0]);
        await fetchMyTickets(accounts[0]);
      }
    } catch (err) {
      const msg = formatError(err);
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="my-tickets px-4 py-6">
        <div className="mx-auto max-w-7xl">
          {/* MetaMask not installed */}
          {!hasMetaMask && (
            <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500">
              <div className="text-sm mb-2">
                MetaMask is not installed. Please install MetaMask to connect
                your wallet.
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

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-white p-4 shadow-sm animate-pulse"
                >
                  <div className="w-full h-40 bg-gray-200 rounded mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>
              ))}
            </div>
          )}

          {!loading && tickets.length === 0 && !errorMsg && walletConnected && (
            <div className="text-center py-16 bg-gray-50 rounded-lg border">
              <div className="text-4xl mb-2">🎟️</div>
              <p className="text-gray-700 font-medium">No tickets found</p>
              <p className="text-gray-500 text-sm mt-1">
                Browse upcoming events and get your first ticket.
              </p>
              <a
                href="/Tickety/events"
                className="inline-block mt-4 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-500"
              >
                See Events
              </a>
            </div>
          )}

          {!loading && tickets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {tickets.map((ticket) => (
                <div key={`${ticket.contractAddress}-${ticket.tokenId}`}>
                  <TicketCard ticket={ticket} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Tickets;
