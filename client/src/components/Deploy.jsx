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
const FACTORY_ADDRESS = "0x0b6cDE8105931e775a178b4e0Ee647DeC2772354";

export default function DeployForm() {
  const [concertName, setConcertName] = useState("");
  const [time, setTime] = useState(""); // Optional, not used in contract
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [agree, setAgree] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) {
      alert("You must agree to the terms.");
      return;
    }
    if (!concertName || !price || !amount) {
      alert("All fields are required.");
      return;
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
      alert("Please enter a valid ticket price.");
      return;
    }

    if (isNaN(amount) || parseInt(amount) <= 0) {
      alert("Please enter a valid number for ticket amount.");
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
      const tx = await factory.createConcert(
        parseInt(amount),
        ethers.parseEther(price),
        concertName,
        timestamp
      );
      const receipt = await tx.wait();
      // 從事件取得新合約地址
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
      alert("Concert deployed at: " + newAddress);
    } catch (err) {
      console.error("Deployment failed:", err);
      alert("Deployment failed. See console for details.");
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
                href="#"
                className="font-medium transition-colors hover:text-gray-900"
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
          <Typography color="green" className="mt-4 text-center font-medium">
            Contract deployed at: {deployedAddress}
          </Typography>
        )}
        <Typography color="gray" className="mt-4 text-center font-normal mb-10">
          Trying to buy a ticket?{" "}
          <a href="events" className="font-medium text-blue-900">
            Click here
          </a>
        </Typography>
      </form>
    </Card>
  );
}
