import { useEffect, useState, memo } from "react";
import Stepper from "react-stepper-horizontal";

const Levels = ({ levelNames = [], quizzLevel = 0 }) => {
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    const quizzSteps = levelNames.map((level) => ({
      title: level.toUpperCase(),
      //icon: sphere,
    }));
    setLevels(quizzSteps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelNames]);

  return (
    <div className="levelsContainer" style={{ background: "transparent" }}>
      <Stepper
        steps={levels}
        activeStep={quizzLevel}
        circleTop={0}
        completeTitleColor="#e0e0e0"
        defaultTitleColor="#e0e0e0"
        completeColor="#0cb765"
        activeColor="#d31017"
        activeTitleColor="#d31017"
        completeBarColor="#e0e0e0"
        size={50}
        //icon={sphere}
      />
    </div>
  );
};

export default memo(Levels);
