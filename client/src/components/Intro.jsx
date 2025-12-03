import React from "react";
import logo from "../assets/tickety.png";

export default function Intro() {
  return (
    <div className="bg-white relative flex items-center justify-center overflow-hidden z-50 ">
      <div className="relative mx-auto h-full px-4  py-20  md:pb-10 sm:max-w-xl md:max-w-full md:px-24 lg:max-w-screen-xl lg:px-8">
        <div className="flex flex-col items-center justify-between lg:flex-row py-1">
          <div className=" relative ">
            <div className="lg:max-w-xl lg:pr-5 relative z-40">
              <h2 className="mb-6 max-w-lg text-center font-light leading-snug tracking-tight text-g1 sm:text-7xl sm:leading-snug">
                A
                <span className="my-1 inline-block border-b-8 border-g4 bg-white px-4 font-bold text-g4 animate__animated animate__flash">
                  Decentralized
                </span>
                ticketing system
              </h2>
              <p className="text-center text-gray-700">
                Every ticket is an NFT, digitally bind to you and you alone!
              </p>
              <div className="mt-10 flex flex-col items-center md:flex-row">
                <a
                  href="/Tickety"
                  className="mb-3 inline-flex h-12 w-full items-center justify-center rounded bg-green-600 px-6 font-medium tracking-wide text-white shadow-md transition hover:bg-blue-800 focus:outline-none md:mr-4 md:mb-0 md:w-auto"
                >
                  View More
                </a>
                <a
                  href="/Tickety/events"
                  aria-label=""
                  className="group inline-flex items-center font-semibold text-g1"
                >
                  buy tickets now
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-4 h-6 w-6 transition-transform group-hover:translate-x-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="relative hidden lg:ml-16 lg:block lg:w-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="my-6 mx-auto h-10 w-10 animate-bounce rounded-full bg-white p-2 lg:hidden"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 17l-4 4m0 0l-4-4m4 4V3"
              ></path>
            </svg>
            <div className="abg-orange-400 mx-auto w-fit overflow-hidden rounded-[6rem] rounded-br-none rounded-tl-none">
              <img src={logo} alt="logo" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
