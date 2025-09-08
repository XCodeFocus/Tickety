import { useWallet } from "../contexts/WalletContext";
export default function ConnectButton() {
  const { account, connectWallet } = useWallet();
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={connectWallet}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        {account ? "Connected" : "Connect to MetaMask"}
      </button>
    </div>
  );
}
