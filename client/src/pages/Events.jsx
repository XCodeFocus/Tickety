import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import EventCard from "../components/EventCard";
import Footer from "../components/Footer";
import ConcertFactoryABI from "../contract/ConcertFactoryABI.json";
import ConcertABI from "../contract/ConcertABI.json";
import { FACTORY_ADDRESS } from "../config";
import { formatError } from "../utils/errors";
import { useToast } from "../components/Toast";
const CID_MAP_KEY = "concertCidMap";
const HIDDEN_KEY = "hidden_concerts";

function Events() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasMetaMask, setHasMetaMask] = useState(
    Boolean(typeof window !== "undefined" && window.ethereum)
  );

  // get hidden list from localStorage
  const getHidden = () => {
    try {
      return JSON.parse(localStorage.getItem(HIDDEN_KEY)) || [];
    } catch {
      return [];
    }
  };

  // add to hidden list and save to localStorage
  const addHidden = (address) => {
    const hidden = getHidden();
    if (!hidden.includes(address)) {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden, address]));
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    setErrorMsg("");
    // Skip fetching when MetaMask/EIP-1193 provider is not available
    if (!window.ethereum) {
      setEvents([]);
      setLoading(false);
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        ConcertFactoryABI,
        provider
      );
      const addresses = await factory.getAllConcerts();
      const hidden = getHidden();
      const cidMap = (() => {
        // fallback only for legacy concerts without on-chain baseCID
        try {
          return JSON.parse(localStorage.getItem(CID_MAP_KEY) || "{}");
        } catch {
          return {};
        }
      })();

      const eventPromises = addresses
        .filter((address) => !hidden.includes(address))
        .map(async (address) => {
          const contract = new ethers.Contract(address, ConcertABI, provider);
          const name = await contract.name();
          const price = await contract.ticketPrice();
          const maxTickets = await contract.maxTickets();
          let sold = 0n;
          try {
            sold = await contract.ticketId();
          } catch (err) {
            console.error("can't acquire ticketId:", err);
          }
          const remain = BigInt(maxTickets) - BigInt(sold);
          const saleActive = await contract.saleActive();
          const concertTime = await contract.concertTime();
          let cid;
          try {
            cid = await contract.baseCID(); // new on-chain storage
            if (cid === "") cid = undefined;
          } catch {
            cid = undefined;
          }
          return {
            address,
            name,
            price: ethers.formatEther(price),
            maxTickets: Number(maxTickets),
            ticketId: Number(sold),
            remain: remain.toString(),
            saleActive,
            time: Number(concertTime) * 1000,
            cid: cid || cidMap[address] || undefined,
          };
        });

      const eventsData = await Promise.all(eventPromises);
      setEvents(eventsData);
    } catch (err) {
      console.error("Failed to load blockchain data", err);
      const msg = formatError(err);
      setErrorMsg(msg);
      toast.error(msg);
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    setHasMetaMask(Boolean(typeof window !== "undefined" && window.ethereum));
    fetchEvents();
  }, []);

  // handle hide event
  const handleDelete = (address) => {
    addHidden(address);
    fetchEvents();
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="show all hidden events"
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-sm text-sm"
                onClick={() => {
                  localStorage.removeItem("hidden_concerts");
                  window.location.reload();
                }}
              >
                Show all
              </button>

              <button
                type="button"
                aria-label="hide all events"
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-sm text-sm disabled:opacity-50"
                onClick={async () => {
                  if (!window.ethereum) return;
                  const provider = new ethers.BrowserProvider(window.ethereum);
                  const factory = new ethers.Contract(
                    FACTORY_ADDRESS,
                    ConcertFactoryABI,
                    provider
                  );
                  const addresses = await factory.getAllConcerts();
                  localStorage.setItem(
                    "hidden_concerts",
                    JSON.stringify(addresses)
                  );
                  window.location.reload();
                }}
              >
                Hide all
              </button>
            </div>
          </div>

          {!hasMetaMask && (
            <div className="mb-4 mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500">
              <div className="text-sm">
                MetaMask is not installed. Please install MetaMask to connect
                your wallet.
              </div>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Install MetaMask
              </a>
            </div>
          )}

          <div className="flex-1">
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border bg-white p-4 shadow-sm animate-pulse"
                  >
                    <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded mb-1" />
                    <div className="h-4 w-1/3 bg-gray-200 rounded mb-1" />
                    <div className="h-8 w-full bg-gray-200 rounded mt-3" />
                  </div>
                ))}
              </div>
            )}

            {!loading && !errorMsg && events.length === 0 && (
              <div className="text-center mt-10 text-gray-600">
                No events found.
              </div>
            )}

            {!loading && !errorMsg && events.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {events.map((event) => (
                  <EventCard
                    key={event.address}
                    event={event}
                    onDelete={handleDelete}
                    onBought={fetchEvents}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
export default Events;
