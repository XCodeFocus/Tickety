import {
  Card,
  Input,
  Checkbox,
  Button,
  Typography,
} from "@material-tailwind/react";
import { useState } from "react";
import { ethers } from "ethers";
import ConcertFactoryABI from "../contract/ConcertFactoryABI.json";
import { FACTORY_ADDRESS } from "../config";
import { formatError } from "../utils/errors";
import { useToast } from "./Toast";

const CID_MAP_KEY = "concertCidMap";

export default function DeployForm() {
  const toast = useToast();
  const [concertName, setConcertName] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [agree, setAgree] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState("");
  const [baseCid, setBaseCid] = useState("");

  const truncateMiddle = (str = "", lead = 6, tail = 4) => {
    if (!str) return "";
    if (str.length <= lead + tail + 3) return str;
    return `${str.slice(0, lead)}...${str.slice(-tail)}`;
  };

  const handleCopy = async (text, label = "") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.info(`${label ? label + " " : ""}copied to clipboard`);
    } catch {
      toast.info("Copied");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) {
      toast.warn("You must agree to the terms.");
      return;
    }
    if (!concertName || !price || !amount || !baseCid) {
      toast.warn("All fields are required.");
      return;
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
      toast.warn("Please enter a valid ticket price.");
      return;
    }

    if (isNaN(amount) || parseInt(amount) <= 0) {
      toast.warn("Please enter a valid number for ticket amount.");
      return;
    }

    try {
      setDeploying(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        ConcertFactoryABI,
        signer
      );

      const timestamp = Math.floor(new Date(time).getTime() / 1000);
      // sanitize CID: remove ipfs:// prefix and any path segments
      const sanitizeCid = (val) => {
        let v = val.trim();
        v = v.replace(/^ipfs:\/\//i, "");
        v = v.replace(/^https?:\/\/[^/]+\//i, ""); // strip gateway domains if pasted
        v = v.split(/[/?#]/)[0];
        return v;
      };
      const rawCid = sanitizeCid(baseCid);
      // rudimentary CID format check (CIDv0 Qm... length 46, CIDv1 often bafy...)
      if (
        !/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(rawCid) &&
        !/^bafy[1-9A-HJ-NP-Za-km-z]{50,}$/.test(rawCid)
      ) {
        toast.warn("CID format looks invalid. Please enter a raw IPFS CID.");
        setDeploying(false);
        return;
      }

      const tx = await factory.createConcert(
        parseInt(amount),
        ethers.parseEther(price),
        concertName,
        timestamp,
        rawCid // on-chain base CID
      );
      const receipt = await tx.wait();
      // extract the deployed contract address from the event logs
      const event = receipt.logs
        .map((log) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e) => e && e.name === "ConcertCreated");
      const newAddress = event ? event.args.concertAddress : "";
      setDeployedAddress(newAddress);

      // localStorage mapping now optional (kept for backward compatibility / offline hints)
      if (newAddress && rawCid) {
        try {
          const map = JSON.parse(localStorage.getItem(CID_MAP_KEY) || "{}");
          map[newAddress] = rawCid;
          localStorage.setItem(CID_MAP_KEY, JSON.stringify(map));
        } catch (e) {
          console.warn("Optional CID mapping store failed", e);
        }
      }
    } catch (err) {
      console.error("Deployment failed:", err);
      toast.error(formatError(err));
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Card
      color="transparent"
      shadow={false}
      className="flex justify-center items-center"
    >
      <Typography variant="h4" color="blue-gray" className="mt-10">
        Set up your event
      </Typography>
      <form
        onSubmit={handleSubmit}
        className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96"
      >
        <div className="mb-1 flex flex-col gap-6">
          <Typography variant="h6" color="blue-gray" className="-mb-3">
            Concert Name
          </Typography>
          <Input
            size="lg"
            placeholder="World Tour 2024"
            value={concertName}
            onChange={(e) => setConcertName(e.target.value)}
          />
          <Typography variant="h6" color="blue-gray" className="-mb-3">
            Time
          </Typography>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border rounded px-2 py-1 w-full mb-2"
          />
          <Typography variant="h6" color="blue-gray" className="-mb-3">
            Ticket Price
          </Typography>
          <Input
            size="lg"
            placeholder="ethers"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Typography variant="h6" color="blue-gray" className="-mb-3">
            Ticket amount
          </Typography>
          <Input
            size="lg"
            placeholder="10000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Typography variant="h6" color="blue-gray" className="-mb-3">
            Metadata CID
          </Typography>
          <Input
            size="lg"
            placeholder="Qm..."
            value={baseCid}
            onChange={(e) => setBaseCid(e.target.value)}
          />
        </div>
        <Checkbox
          checked={agree}
          onChange={() => setAgree(!agree)}
          label={
            <Typography
              variant="small"
              color="gray"
              className="flex items-center font-normal"
            >
              I agree the
              <a
                href="https://senior-brown-chameleon.myfilebase.com/ipfs/QmRekXY6UoiKBdgxekLt4VpsNJsVdCWjtJTygzBtQqkznF"
                className="font-medium text-blue-900 underline transition-colors hover:text-blue-700"
              >
                &nbsp;Terms and Conditions
              </a>
            </Typography>
          }
          containerProps={{ className: "-ml-2.5" }}
        />
        <Button className="mt-6" fullWidth type="submit" disabled={deploying}>
          {deploying ? "Deploying..." : "Set up"}
        </Button>
        {deployedAddress && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-green-500 text-white flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                  <path
                    d="M16.667 5.833 8.333 14.167 5 10.833"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900">
                  Deployment successful
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-900/80">Contract:</span>
                    <code className="rounded bg-white px-1.5 py-0.5 text-green-900 shadow-sm">
                      {truncateMiddle(deployedAddress)}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(deployedAddress, "Address")}
                      className="ml-1 rounded border border-green-300 bg-white px-2 py-0.5 text-xs text-green-800 hover:bg-green-100"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <a
                    href="/Tickety/events"
                    className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-green-700"
                  >
                    View in Events
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        <Typography color="gray" className="mt-4 text-center font-normal mb-10">
          Trying to buy a ticket?{" "}
          <a href="/Tickety/events" className="font-medium text-blue-900">
            Click here
          </a>
        </Typography>
      </form>
    </Card>
  );
}
