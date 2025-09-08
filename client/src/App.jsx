import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import About from "./pages/About";
import Events from "./pages/Events";
import Home from "./pages/Home";
import NoPage from "./pages/NoPage";
import BackStage from "./pages/BackStage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/backstage" element={<BackStage />} />
        <Route path="/*" element={<NoPage />} />
      </Routes>
    </Router>
  );
}
