import React from "react";
import { METADATA_GATEWAY } from "../config";

// Helper to map ipfs:// to configured HTTP gateway
const ipfsToHttp = (url) =>
  typeof url === "string" && url.startsWith("ipfs://")
    ? METADATA_GATEWAY + url.replace("ipfs://", "")
    : url;

// Exported ticket card used by Tickets.jsx
export function TicketCard({ ticket }) {
  const truncate = (addr) =>
    typeof addr === "string" && addr.length > 10
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr || "";

  const attributes = Array.isArray(ticket?.attributes) ? ticket.attributes : [];

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col">
      {ticket?.image && (
        <img
          src={ipfsToHttp(ticket.image)}
          alt={ticket?.name || "ticket"}
          className="w-full h-40 object-cover rounded-lg mb-3"
        />
      )}

      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-900 truncate mr-2">
          {ticket?.name || "Ticket"}
        </h3>
        {ticket?.tokenId && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            Token ID: {ticket.tokenId}
          </span>
        )}
      </div>

      {ticket?.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-3">
          {ticket.description}
        </p>
      )}

      {attributes.length > 0 && (
        <div className="mt-2 mb-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attributes.map((attr, idx) => {
            const label = attr?.trait_type || attr?.traitType || "Property";
            const raw = attr?.value;
            const value = Array.isArray(raw)
              ? raw.join(", ")
              : typeof raw === "object" && raw !== null
              ? JSON.stringify(raw)
              : String(raw ?? "-");
            return (
              <div
                key={idx}
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5"
                title={`${label}: ${value}`}
              >
                <div className="text-[10px] uppercase tracking-wide text-gray-500">
                  {label}
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ticket?.contractAddress && (
        <div className="mt-auto pt-2 border-t text-xs text-gray-500 flex items-center justify-between">
          <span>Contract</span>
          <code className="font-mono">{truncate(ticket.contractAddress)}</code>
        </div>
      )}
    </div>
  );
}

export default TicketCard;
