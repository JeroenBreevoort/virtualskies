const tintColorLight = "#2f95dc";
const tintColorDark = "#fff";

const sharedColors = {
  primary: "#20AB6E",
  lime: "#D7FFD4",
  pink: "#F655FF",
  brown: "#29271D",
  sky: "#E5EDFF",
  teal: "#0E4D45",
  yellow: "#FCBB80",
  orange: "#EF580B",
  blue: "#0000FA",
  green: "#172E15",
  grey: "#242026",
  greyLight: "#7C7C7C",
  input: "#EEE9F0",
  selected: "#F7F2F9",
} as const;

export default {
  ...sharedColors,
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    tabIconDefault: "#7c7c7c",
    tabIconSelected: tintColorLight,
    border: "#E5E5E5",
    ...sharedColors,
  },
  dark: {
    text: "#fff",
    background: "#000",
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
    border: "#333333",
    ...sharedColors,
  },
};
