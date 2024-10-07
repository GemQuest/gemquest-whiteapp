import { memo } from "react";

const ProgressBar = ({ idQuestion, maxQuestions }) => {
  const getWidth = (totalQuestions, questionId) => {
    return (100 / totalQuestions) * questionId;
  };

  const actualQuestion = idQuestion + 1;
  const progressPercent = getWidth(maxQuestions, actualQuestion);

  return (
    <>
      <div className="percentage">
        <div className="progressPercent">{`Question: ${actualQuestion}/${maxQuestions}`}</div>
        <div className="progressPercent">{`Progess: ${progressPercent.toFixed(
          1
        )}%`}</div>
      </div>
      <div className="progressBar">
        <div
          className="progressBarChange"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </>
  );
};

export default memo(ProgressBar);
