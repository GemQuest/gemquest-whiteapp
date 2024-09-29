import { useState, useRef, useEffect } from "react";

const Footer = () => {
  const [disclaimer, setDisclaimer] = useState(false);
  const disclaimerRef = useRef();

  useEffect(() => {
    if (typeof window !== "undefined") {
      function handleClickOutside(event) {
        if (disclaimerRef.current) {
          setDisclaimer(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disclaimerRef]);

  return (
    <footer>
      <div className="footer-container">
        <div className="footer" id="footer">
          &copy; Copyright - App made with{" "}
          <span aria-label="heart emoji"> ❤️ </span> by The GemQuest Team -{" "}
          {new Date().getFullYear()}
          <br />
          <p>
            <button
              className="disclaimerBtn"
              onClick={() => setDisclaimer(true)}
            >
              Disclaimer
            </button>
          </p>
        </div>
      </div>
      {disclaimer && (
        <div ref={disclaimerRef} className="disclaimer">
          <p>
            All trademarks, movies, TV shows, logos, and characters from various
            sci-fi universes are the sole property of their respective owners.
            This app, along with the associated Quizzes and NFTs, is not
            endorsed by, sponsored by, nor affiliated with any of these
            entities. No commercial exhibition or distribution is permitted. No
            alleged independent rights will be asserted against any of the
            rights holders.
          </p>
        </div>
      )}
    </footer>
  );
};

export default Footer;
