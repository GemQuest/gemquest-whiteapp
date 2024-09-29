interface SciFiSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

const SciFiSelect: React.FC<SciFiSelectProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <div className="scifi-select-container">
      <select
        className="scifi-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SciFiSelect;
