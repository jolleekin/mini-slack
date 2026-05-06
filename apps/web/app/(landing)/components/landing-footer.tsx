import { JSX } from "react";

export function LandingFooter(): JSX.Element {
  return (
    <footer className="border-t border-gray-6 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-gray-11 text-center">
          &copy; {new Date().getFullYear()} MiniSlack
        </p>
      </div>
    </footer>
  );
}
