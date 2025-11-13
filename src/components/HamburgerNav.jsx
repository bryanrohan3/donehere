import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function HamburgerNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="max-w-3xl mx-auto flex items-center justify-between p-3">
        {/* Logo / Title */}
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

        {/* Hamburger Button */}
        <button
          aria-label="menu"
          onClick={() => setOpen(!open)}
          className={`p-2 rounded-md bg-amber-100 hover:bg-amber-200 transition-all duration-150 ${
            open ? "rotate-90" : ""
          }`}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <nav
          ref={menuRef}
          className="border-t bg-white shadow-inner animate-slide-down"
        >
          <div className="max-w-3xl mx-auto flex flex-col p-3 gap-2">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="p-2 rounded hover:bg-neutral-100"
            >
              Fart
            </Link>
            <Link
              to="/map"
              onClick={() => setOpen(false)}
              className="p-2 rounded hover:bg-neutral-100"
            >
              Map
            </Link>
            <Link
              to="/stats"
              onClick={() => setOpen(false)}
              className="p-2 rounded hover:bg-neutral-100"
            >
              Stats
            </Link>
            <Link
              to="/about"
              onClick={() => setOpen(false)}
              className="p-2 rounded hover:bg-neutral-100"
            >
              About
            </Link>
            <Link
              to="/my-farts"
              onClick={() => setOpen(false)}
              className="p-2 rounded hover:bg-neutral-100"
            >
              My Farts
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
