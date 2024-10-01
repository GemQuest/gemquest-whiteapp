const Loader = ({ loadingMsg, styling }) => {
  return (
    <>
      <div className="loader"></div>
      <h2 style={styling}>{loadingMsg}</h2>
    </>
  );
};

export default Loader;
