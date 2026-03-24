import Navbar from "./components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />


      {/* CTA Section */}
      <section className="cta-section">
        <h2>
          Abhi shuru karo।<br />Free hai।
        </h2>
        <p>Koi credit card nahi chahiye। 2 minute mein ready।</p>
        <Link
          href="/register"
          className="btn-hero btn-hero-primary"
          style={{ margin: "0 auto" }}
        >
          Account banao — free
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

     
    </>
  );
}