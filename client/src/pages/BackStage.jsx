import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DeployForm from "../components/Deploy";

function BackStage() {
  return (
    <div className="app-container">
      <Navbar />
      <DeployForm />
      <Footer />
    </div>
  );
}

export default BackStage;
