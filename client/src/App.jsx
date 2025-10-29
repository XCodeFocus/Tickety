import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import About from "./pages/About";
import Events from "./pages/Events";
import Home from "./pages/Home";
import NoPage from "./pages/NoPage";
import BackStage from "./pages/BackStage";
import Tickets from "./pages/Tickets";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="Tickety/" element={<Home />} />
        <Route path="Tickety/about" element={<About />} />
        <Route path="Tickety/events" element={<Events />} />
        <Route path="Tickety/backstage" element={<BackStage />} />
        <Route path="Tickety/tickets" element={<Tickets />} />
        <Route path="Tickety/*" element={<NoPage />} />
      </Routes>
    </Router>
  );
}
