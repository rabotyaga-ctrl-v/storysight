import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import GenerateCharacter from './pages/GenerateCharacter';
import MyProjects from "./pages/MyProjects";
import Choise from "./pages/Choise";
import Manual from "./pages/manual";         // новый ручной ввод
import TelegramLogin from "./pages/TelegramLogin";
import ResultMain from "./pages/ResultMain";

// Если появится логика пошагового опроса — можно будет подключить
// import ChatSteps from "./pages/ChatSteps";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/generate-character" element={<GenerateCharacter />} />
                <Route path="/login" element={<TelegramLogin />} />
                <Route path="/choise" element={<Choise />} />
                <Route path="/manual" element={<Manual />} />
                <Route path="/result-main" element={<ResultMain />} />
                <Route path="/my-projects" element={<MyProjects />} />

                {/* если добавим шаги с ChatGPT */}
                {/* <Route path="/chat-steps" element={<ChatSteps />} /> */}
            </Routes>
        </Router>
    );
};

export default App;
