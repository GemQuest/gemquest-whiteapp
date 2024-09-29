import { useRouter } from "next/router";
import ReactTooltip from "react-tooltip-rc";

const Header = () => {
  const router = useRouter();
  const isHomePage = router.pathname === "/";

  return (
    <header>
      <div className="banner-container">
        <h1>GemQuest</h1>
        {isHomePage && (
          <>
            <hr />
            <h4>
              Test your knowledge of the Sci-Fi universes to win 💎
              <br /> And exchange them for rewards!
            </h4>
            <hr />
          </>
        )}
      </div>
      <ReactTooltip place="left" effect="solid" />
    </header>
  );
};

export default Header;
