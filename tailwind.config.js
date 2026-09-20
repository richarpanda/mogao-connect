/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                mogao: {
                    teal:      "#0E3B36",
                    tealDark:  "#071F1C",
                    tealLight: "#155A52",
                    gold:      "#C9A227",
                    goldLight: "#E6C767",
                    goldDark:  "#8A6C1B",
                    cream:     "#FAF7F0",
                },
            },
        },
    },
    plugins: [],
};
