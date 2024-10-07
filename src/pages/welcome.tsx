import { useEffect, useState, useCallback, useMemo } from "react";
import Logout from "../components/Logout";
import Quizz from "../components/Quizz";
import { useTheme } from "../lib/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import { useRouter } from "next/router";
import gemQuest from "../images/gemquest.webp";
import RPC from "../services/solanaRPC";
import Loader from "../components/Loader";

const Welcome = ({
  logout,
  provider,
  rpc,
}: {
  logout: () => void;
  provider: any;
  rpc: RPC;
}) => {
  const {
    theme,
    setTheme,
    difficulty,
    setDifficulty,
    isSignedIn,
    setIsInQuiz,
  } = useTheme();
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  const generateQuiz = useCallback(async () => {
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme, difficulty }),
      });

      const data = await response.json();
      if (response.ok) {
        setQuizData(data.quiz);
        console.log("quizData after setting:", data.quiz);
      } else {
        console.error("Failed to generate quiz:", data);
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
    }
  }, [theme, difficulty]);

  const handleBackToHome = useCallback(() => {
    setIsInQuiz(false);
    setTheme(undefined);
    setDifficulty("easy");
    //setQuizData(null);
    router.push("/");
  }, [setIsInQuiz, setTheme, setDifficulty, router]);

  useEffect(() => {
    const handlePopState = () => {
      setIsInQuiz(false);
      setTheme(undefined);
      setDifficulty("easy");
      //setQuizData(null);
      router.push("/");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, setIsInQuiz, setTheme, setDifficulty]);

  useEffect(() => {
    setHydrated(true);
    if (!isSignedIn) {
      handleBackToHome();
    }
  }, [isSignedIn, handleBackToHome]);

  useEffect(() => {
    setIsInQuiz(true);
    return () => setIsInQuiz(false);
  }, [setIsInQuiz]);

  useEffect(() => {
    const fetchData = async () => {
      if (isSignedIn && theme) {
        await generateQuiz();
        setLoading(false);
      } else if (!theme) {
        toast.error("Quiz failed", {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          progress: undefined,
        });
        router.push("/");
      }
    };
    fetchData();
  }, [theme, generateQuiz, isSignedIn, router]);

  const memoizedQuizData = useMemo(() => quizData, [quizData]);

  useEffect(() => {
    console.log("quizData updated:", memoizedQuizData);
  }, [memoizedQuizData]);

  if (!hydrated) {
    return null;
  }

  return (
    <div className="quiz-bg">
      <ToastContainer />
      {isSignedIn ? (
        <div className="container">
          <Logout logout={logout} onBackToHome={handleBackToHome} />
          {loading ? (
            <Loader
              loadingMsg={"Generating quiz..."}
              styling={{
                color: "skyblue",
                fontSize: "2rem",
                textAlign: "center",
              }}
            />
          ) : (
            <Quizz
              quizData={memoizedQuizData}
              provider={provider}
              setQuizData={setQuizData}
              logout={logout}
              rpc={rpc}
            />
          )}
        </div>
      ) : (
        <div className="formContent">
          <button
            className="btnSubmit"
            style={{ marginTop: "50px", marginBottom: "30px" }}
            type="button"
            onClick={handleBackToHome}
          >
            Main Menu
          </button>

          <img
            src={gemQuest.src}
            alt="GemQuest"
            style={{
              display: "block",
              maxWidth: "600px",
              width: "90%",
              margin: "0 auto",
              borderRadius: "10px",
              boxShadow: "0 0 5px 5px skyblue",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Welcome;
