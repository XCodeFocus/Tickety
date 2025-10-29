import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import EventCard from "../components/EventCard";
import Footer from "../components/Footer";
import ConcertFactoryABI from "../contract/ConcertFactoryABI.json";
import ConcertABI from "../contract/ConcertABI.json";
const FACTORY_ADDRESS = "0x5c6bE22B7B5db415d942a2E42a388eBa3cB0F397";
const HIDDEN_KEY = "hidden_concerts";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        ConcertFactoryABI,
        provider
      );
      const addresses = await factory.getAllConcerts();
      const hidden = getHidden();
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
          return {
            address,
            name,
            price: ethers.formatEther(price),
            maxTickets: Number(maxTickets),
            ticketId: Number(sold),
            remain: remain.toString(),
            saleActive,
            time: Number(concertTime) * 1000,
          };
        });

      const eventsData = await Promise.all(eventPromises);
      setEvents(eventsData);
    } catch (err) {
      console.error("Failed to load blockchain data", err);
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
    if (window.confirm("Are you sure you want to hide this event?")) {
      addHidden(address);
      fetchEvents();
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className="flex items-center gap-2 mt-4 ml-4">
        <button
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
          aria-label="hide all events"
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-sm text-sm"
          onClick={async () => {
            // get all contract addresses
            const provider = new ethers.BrowserProvider(window.ethereum);
            const factory = new ethers.Contract(
              FACTORY_ADDRESS,
              ConcertFactoryABI,
              provider
            );
            const addresses = await factory.getAllConcerts();
            localStorage.setItem("hidden_concerts", JSON.stringify(addresses));
            window.location.reload();
          }}
        >
          Hide all
        </button>
      </div>

      {!hasMetaMask && (
        <div className="mb-4 mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500">
          <div className="text-sm">
            MetaMask is not installed. Please install MetaMask to connect your
            wallet.
          </div>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            install MetaMask
          </a>
        </div>
      )}

      <div className="flex-1">
        {loading ? (
          <div className="text-center mt-10">loading...</div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.address}
              event={event}
              onDelete={handleDelete}
              onBought={fetchEvents}
            />
          ))
        )}
      </div>
      <Footer />
    </div>
  );
}
export default Events;
