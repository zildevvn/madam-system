import React from "react";
import ReactDOM from "react-dom/client";
import "../css/app.css";
import "../scss/app.scss";


function App() {
    return (
        <div>
            <h1>Hello React + Laravel 🚀</h1>
        </div>
    );
}


ReactDOM.createRoot(document.getElementById("app")).render(<App />);