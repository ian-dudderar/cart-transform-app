import styles from "./Knob.module.css";

/**
 * Knob component
 * @param {KnobProps} props - The props for the Knob component
 * @returns {JSX.Element} The rendered Knob component
 */
export const Knob = ({ ariaLabel, selected, onClick }) => {
  return (
    <button
      id=":rgi:"
      className={`${styles.track} ${selected && styles.track_on}`}
      aria-label={ariaLabel}
      role="switch"
      type="button"
      aria-checked="false"
      onClick={onClick}
    >
      <div className={`${styles.knob} ${selected && styles.knob_on}`}></div>
    </button>
  );
};
