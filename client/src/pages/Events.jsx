import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import EventCard from "../components/EventCard";
import Footer from "../components/Footer";
import ConcertFactoryABI from "../contract/ConcertFactoryABI.json";
import ConcertABI from "../contract/ConcertABI.json";
const FACTORY_ADDRESS = "0x591A0204CFAA41B17517E63C5B48ed2C043E4137";
const HIDDEN_KEY = "hidden_concerts";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <button
        className="px-2 py-1 bg-gray-500 hover:bg-green-600 text-white shadow"
        onClick={() => {
          localStorage.removeItem("hidden_concerts");
          window.location.reload();
        }}
      >
        show all hidden events
      </button>
      <button
        className="px-2 py-1 bg-gray-500 hover:bg-red-600 text-white shadow"
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
        hide all events
      </button>
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
