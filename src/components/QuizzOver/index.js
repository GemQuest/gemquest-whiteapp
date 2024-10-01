import { forwardRef, memo, useState, useEffect } from "react";
import { GiTrophyCup } from "react-icons/gi";
import { SiStartrek } from "react-icons/si";
import Loader from "../Loader";
import { gemAddresses } from "@/utils";
import { ToastContainer, toast } from "react-toastify";
import { useTheme } from "../../lib/ThemeContext";

const QuizzOver = forwardRef((props, ref) => {
  const {
    levelNames,
    score,
    quizzLevel,
    percent,
    maxQuestions,
    loadLevelQuestions,
    askedQuestions,
    isLastLevel,
    setQuizData,
    rpc,
  } = props;

  const [loading, setLoading] = useState(false);
  const { difficulty, isSignedIn, setIsInQuiz, setIsAdmin } = useTheme();
  const [gemsEarned, setGemsEarned] = useState(0);

  const getFinalMessage = (score) => {
    if (score === 0)
      return "Don't worry! You can try again and conquer the stars!";
    if (score <= 3)
      return "Good effort, Captain! Keep training and you'll reach the stars!";
    if (score <= 6)
      return "Well done, Commander! You're on your way to greatness!";
    if (score < 9)
      return "Excellent work, Admiral! You're nearly a star expert!";
    return "Outstanding, Admiral! You're an expert among the stars!";
  };

  const calculateGemsEarned = (correctAnswers) => {
    const baseGemsPerCorrectAnswer = { easy: 1, intermediate: 2, expert: 3 };
    const difficultyMultiplier = { easy: 1, intermediate: 1.1, expert: 1.2 };
    const baseGems = correctAnswers * baseGemsPerCorrectAnswer[difficulty];
    const totalGems = baseGems * difficultyMultiplier[difficulty];
    return Math.min(Math.round(totalGems), 30);
  };

  const handleMintGems = async () => {
    // let gemsToMint = 300; // For testing, replace with gemsEarned in production
    let gemsToMint = gemsEarned;
    if (gemsToMint === 0) return;
    setLoading(true);
    const gemValues = [20, 10, 5, 1];
    let mintingTasks = [];

    try {
      for (const value of gemValues) {
        const numOfGems = Math.floor(gemsToMint / value);
        if (numOfGems > 0) {
          mintingTasks.push(await rpc.mintGems(numOfGems, gemAddresses[value]));
          gemsToMint -= numOfGems * value;
        }
      }
      await Promise.all(mintingTasks);
      toast.success(`${gemsEarned} gems minted in your wallet !`, {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
      setGemsEarned(0);
    } catch (error) {
      console.error(error);
      toast.error("Error during minting", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        //setQuizData(null);
        setIsInQuiz(false);
        //setIsAdmin(false);
        window.history.back();
      }, 2000);
    }
  };

  useEffect(() => {
    setGemsEarned(calculateGemsEarned(score));
  }, [difficulty, score]);

  useEffect(() => {
    return () => setIsInQuiz(false);
  }, [setIsInQuiz]);

  const renderLastLevelDecision = () => (
    <>
      <div className="stepsBtnContainer">
        <p className="successMsg">
          <GiTrophyCup size="40px" /> {getFinalMessage(score)}{" "}
        </p>
        {score > 0 && (
          <div>
            <button
              className="btnResult gameOver"
              disabled={loading || score === 0 || !isSignedIn}
              onClick={handleMintGems}
            >
              💎 Mint Your Gems ! 💎
            </button>
            <p className="progressPercent" style={{ marginTop: "10px" }}>
              Gems earned: {gemsEarned} 💎
            </p>
          </div>
        )}
      </div>
      <div className="percentage">
        <div className="progressPercent">
          Your score: {percent.toFixed(1)} %
        </div>
        <div className="progressPercent">
          Your mark: {score}/{maxQuestions * levelNames.length}
        </div>
      </div>
    </>
  );

  const renderNextLevelDecision = () => (
    <>
      <div className="stepsBtnContainer">
        <p className="successMsg">
          <SiStartrek size="50px" /> Go ahead {levelNames[quizzLevel]}!
        </p>
        <button
          className="btnResult success"
          onClick={() => {
            setIsInQuiz(true);
            loadLevelQuestions(quizzLevel);
          }}
        >
          Next level
        </button>
      </div>
      <div className="percentage">
        <div className="progressPercent">
          Your score: {percent.toFixed(1)} %
        </div>
        <div className="progressPercent">
          Your mark: {score}/{maxQuestions * (quizzLevel + 1)}
        </div>
      </div>
    </>
  );

  const renderQuestionsAndAnswers = () => (
    <table className="answers">
      <thead>
        <tr>
          <th>Questions</th>
          <th>Answers</th>
          <th>Your Answers</th>
        </tr>
      </thead>
      <tbody>
        {askedQuestions.map((questionData, index) => (
          <tr key={index}>
            <td>{questionData.question}</td>
            <td>{questionData.answer}</td>
            <td>{questionData.userAnswer}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <ToastContainer />
      {isLastLevel ? renderLastLevelDecision() : renderNextLevelDecision()}
      {loading ? (
        <Loader
          loadingMsg={"Minting your Gems in progress..."}
          styling={{ textAlign: "center" }}
        />
      ) : (
        <>
          <hr />
          <div className="answerContainer">{renderQuestionsAndAnswers()}</div>
        </>
      )}
    </>
  );
});

export default memo(QuizzOver);
