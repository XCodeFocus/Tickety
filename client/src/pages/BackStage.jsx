import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DeployForm from "../components/Deploy";

export default function BackStage() {
  return (
    <div className="app-container">
      <Navbar />
      <DeployForm />
      <Footer />
    </div>
  );
}
