import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import Levels from "../Levels";
import ProgressBar from "../ProgressBar";
import QuizzOver from "../QuizzOver";
import { GiCyborgFace } from "react-icons/gi";
import { SiStartrek } from "react-icons/si";
import Header from "../Header";
import { useRouter } from "next/navigation";
import { useTheme } from "../../lib/ThemeContext";

const Quizz = ({ quizData, setQuizData, provider, logout, rpc }) => {
  const router = useRouter();
  const { theme, difficulty, setIsInQuiz } = useTheme();

  useEffect(() => {
    setIsInQuiz(true);
    return () => setIsInQuiz(false);
  }, [setIsInQuiz]);

  // useEffect(() => {
  //   const handleBeforeUnload = (e) => {
  //     e.preventDefault();
  //     e.returnValue =
  //       "Are you sure you want to leave? Your progress will be lost.";
  //   };

  //   window.addEventListener("beforeunload", handleBeforeUnload);

  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //   };
  // }, []);

  if (!quizData?.quizz || quizData.quizz.length === 0) {
    toast.error("Try again", {
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
    return null;
  }

  const initialState = {
    levelNames: ["ensign", "captain", "admiral"],
    quizzLevel: 0,
    maxQuestions: 3,
    storedQuestions: [],
    question: null,
    options: [],
    idQuestion: 0,
    btnDisabled: true,
    userAnswer: null,
    score: 0,
    showWelcomeMsg: false,
    quizzEnd: false,
    percent: 0,
    askedQuestions: [],
    pause: false,
  };

  const [state, setState] = useState(initialState);
  const storedDataRef = useRef();

  useEffect(() => {
    if (typeof window !== "undefined" && !state.pause && !state.quizzEnd) {
      loadQuestions(state.levelNames[state.quizzLevel]);
      setState((prevState) => ({ ...prevState }));
    }
  }, [state.quizzLevel, state.pause, state.quizzEnd]);

  const loadQuestions = (level) => {
    const fetchedArrayQuizz = quizData.quizz[level];
    if (fetchedArrayQuizz?.length >= state.maxQuestions) {
      storedDataRef.current = fetchedArrayQuizz;
      const newArray = fetchedArrayQuizz.map(
        ({ question, options, answer, ...keepRest }) => ({
          ...keepRest,
          question,
          options,
          answer,
        })
      );
      setState((prevState) => ({ ...prevState, storedQuestions: newArray }));
    } else {
      console.log("Not enough questions");
    }
  };

  useEffect(() => {
    if (state.storedQuestions.length) {
      setState((prevState) => ({
        ...prevState,
        question: state.storedQuestions[state.idQuestion].question,
        options: state.storedQuestions[state.idQuestion].options,
      }));
    }
  }, [state.storedQuestions]);

  useEffect(() => {
    if (state.idQuestion < state.storedQuestions.length) {
      setState((prevState) => ({
        ...prevState,
        question: state.storedQuestions[state.idQuestion].question,
        options: state.storedQuestions[state.idQuestion].options,
        userAnswer: null,
        btnDisabled: true,
      }));
    }
  }, [state.idQuestion]);

  useEffect(() => {
    if (state.quizzEnd) {
      const gradePercent = getPercent(
        state.maxQuestions * state.levelNames.length,
        state.score
      );
      gameOver(gradePercent);
    }
  }, [state.quizzEnd]);

  useEffect(() => {
    if (!state.showWelcomeMsg) {
      showToastMsg();
    }
  }, [state.showWelcomeMsg]);

  const showToastMsg = () => {
    if (!state.showWelcomeMsg) {
      setState((prevState) => ({ ...prevState, showWelcomeMsg: true }));
      toast.warn(`Welcome and Good luck 🦾`, {
        theme: "dark",
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
    }
  };

  const submitAnswer = (answer) => {
    setState((prevState) => ({
      ...prevState,
      userAnswer: answer,
      btnDisabled: false,
    }));
  };

  const getPercent = (maxQuest, ourScore) => (ourScore / maxQuest) * 100;

  const gameOver = (percent) => {
    setState((prevState) => ({
      ...prevState,
      quizzEnd: true,
      percent,
    }));
  };

  const nextQuestion = () => {
    const goodAnswer = state.storedQuestions[state.idQuestion].answer;

    if (String(state.userAnswer) === String(goodAnswer)) {
      setState((prevState) => ({ ...prevState, score: prevState.score + 1 }));
    }

    const updatedAskedQuestions = [
      ...state.askedQuestions,
      {
        question: state.question,
        answer: goodAnswer,
        userAnswer: state.userAnswer,
      },
    ];

    if (state.idQuestion === state.maxQuestions - 1) {
      if (state.quizzLevel === state.levelNames.length - 1) {
        setState((prevState) => ({
          ...prevState,
          quizzEnd: true,
          askedQuestions: updatedAskedQuestions,
        }));
      } else {
        setState((prevState) => ({
          ...prevState,
          pause: true,
          askedQuestions: updatedAskedQuestions,
        }));
      }
    } else {
      setState((prevState) => ({
        ...prevState,
        idQuestion: prevState.idQuestion + 1,
        userAnswer: null,
        btnDisabled: true,
        askedQuestions: updatedAskedQuestions,
      }));
      toast.info("Next Question ! 🚀🚀", {
        theme: "dark",
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
    }
  };

  const loadLevelQuestions = (param) => {
    setState({
      ...initialState,
      quizzLevel: param,
    });
    loadQuestions(state.levelNames[param]);
  };

  const continueToNextLevel = () => {
    setState((prevState) => ({
      ...prevState,
      quizzLevel: prevState.quizzLevel + 1,
      idQuestion: 0,
      pause: false,
    }));
  };

  const displayOptions = state.options.map((option, index) => (
    <p
      key={index}
      onClick={() => submitAnswer(option)}
      className={`answerOptions ${
        state.userAnswer === option ? "selected" : null
      }`}
    >
      <GiCyborgFace /> {option}
    </p>
  ));

  return state.quizzEnd ? (
    <>
      <Header />
      <QuizzOver
        ref={storedDataRef}
        levelNames={state.levelNames}
        score={state.score}
        maxQuestions={state.maxQuestions}
        quizzLevel={state.quizzLevel}
        percent={state.percent}
        loadLevelQuestions={loadLevelQuestions}
        askedQuestions={state.askedQuestions}
        isLastLevel={true}
        provider={provider}
        setQuizData={setQuizData}
        logout={logout}
        rpc={rpc}
      />
    </>
  ) : state.pause ? (
    <>
      <Header />
      <div className="stepsBtnContainer">
        <p className="successMsg">
          <SiStartrek size="50px" /> Go ahead{" "}
          {state.levelNames[state.quizzLevel]}!
        </p>
        <button className="btnResult success" onClick={continueToNextLevel}>
          Next level
        </button>
      </div>
    </>
  ) : (
    <>
      <ToastContainer />
      <div style={{ width: "80%", margin: "0 auto" }}>
        <Header />
        <h1
          style={{
            color: "#34343f",
            backgroundImage: "linear-gradient(45deg, #f3f3f3, #34343f)",
            fontSize: "1.5rem",
            display: "inlineBlock",
            marginBottom: "10px",
            borderRadius: "5px",
            padding: "10px",
          }}
        >
          Challenge : {theme}, {difficulty}
        </h1>

        <Levels levelNames={state.levelNames} quizzLevel={state.quizzLevel} />
        <ProgressBar
          idQuestion={state.idQuestion}
          maxQuestions={state.maxQuestions}
        />
        <h2 style={{ color: "aqua" }}>
          <SiStartrek /> {state.question}
        </h2>
        {displayOptions}
        <button
          disabled={state.btnDisabled}
          className="btnSubmit"
          onClick={nextQuestion}
          style={{ marginBottom: "15px" }}
        >
          {state.idQuestion < state.maxQuestions - 1 ? "Next" : "Finished"}
        </button>
      </div>
    </>
  );
};

export default Quizz;
