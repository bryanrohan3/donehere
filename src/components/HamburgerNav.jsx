import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function HamburgerNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return +(
    <header className="bg-white shadow-sm sticky top-0 z-1000">
      <div className="max-w-3xl mx-auto flex items-center justify-between p-3 relative">
        {/* Left Section - Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-200 w-10 h-10 flex items-center justify-center font-bold text-lg">
            💨
          </div>
          <div>
            <div className="text-lg font-semibold text-neutral-800">
              I Farted Here
            </div>
            <div className="text-xs text-neutral-500">No login, just gas</div>
          </div>
        </div>

        {/* Right Section - Profile + Hamburger */}
        <div className="flex items-center gap-3">
          {/* Profile Icon */}
          <button
            onClick={() => {
              navigate("/profile");
              setOpen(false);
            }}
            className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 transition-all duration-150 text-xl"
            aria-label="Profile"
          >
            👤
          </button>

          {/* Hamburger Button */}
          <button
            ref={buttonRef}
            aria-label="menu"
            onClick={() => setOpen((prev) => !prev)}
            className={`p-2 rounded-md bg-amber-100 hover:bg-amber-200 transition-transform duration-150 text-lg ${
              open ? "rotate-90" : ""
            }`}
          >
            ☰
          </button>
        </div>

        {/* Overlay Menu */}
        {open && (
          <>
            {/* Background overlay (blur + fade) */}
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20"
              onClick={() => setOpen(false)}
            ></div>

            {/* Menu content */}
            <nav
              ref={menuRef}
              className="fixed top-16 right-3 w-48 bg-white shadow-lg rounded-2xl border border-neutral-200 z-30 animate-fade-slide"
            >
              <div className="flex flex-col p-3 gap-1">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-amber-50 transition-all"
                >
                  💨 Fart
                </Link>
                <Link
                  to="/map"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-amber-50 transition-all"
                >
                  🗺️ Map
                </Link>
                <Link
                  to="/stats"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-amber-50 transition-all"
                >
                  📊 Stats
                </Link>
                <Link
                  to="/about"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-amber-50 transition-all"
                >
                  ℹ️ About
                </Link>
              </div>
            </nav>
          </>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-slide {
          animation: fadeSlide 0.2s ease-out;
        }
      `}</style>
    </header>
  );
}
