import { useRouter } from "next/router";
import { useTheme } from "../../lib/ThemeContext";
import ReactTooltip from "react-tooltip-rc";

const Logout = ({ logout, onBackToHome }) => {
  const router = useRouter();
  const { setTheme, setDifficulty, setIsInQuiz, setIsAdmin, setIsSignedIn } =
    useTheme();

  const handleLogout = async () => {
    setTheme(null);
    setDifficulty("easy");
    setIsInQuiz(false);
    setIsAdmin(false);
    setIsSignedIn(false);
    await logout();
    router.push("/");
  };

  return (
    <div className="logoutContainer">
      <button
        className="logoutButton"
        onClick={handleLogout}
        data-tip="Disengage from the system"
      >
        <span className="logoutText">Disengage</span>
        <span className="logoutGlow"></span>
      </button>
      <button
        className="backButton"
        onClick={onBackToHome}
        data-tip="Return to main menu"
      >
        <span className="backText">Main Menu</span>
        <span className="backGlow"></span>
      </button>
      <ReactTooltip place="left" effect="solid" />
    </div>
  );
};

export default Logout;
