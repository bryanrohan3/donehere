import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function HamburgerNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="max-w-3xl mx-auto flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-200 w-10 h-10 flex items-center justify-center font-bold">
            💨
          </div>
          <div>
            <div className="text-lg font-semibold">I Farted Here</div>
            <div className="text-xs text-neutral-500">No login, just gas</div>
          </div>
        </div>
        <button
          aria-label="menu"
          onClick={() => setOpen(!open)}
          className="p-2 rounded-md bg-amber-100"
        >
          ☰
        </button>
      </div>

      {open && (
        <nav className="border-t bg-white">
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
          </div>
        </nav>
      )}
    </header>
  );
}
