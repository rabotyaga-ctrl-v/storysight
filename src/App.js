import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import MyProjects from "./pages/myprojects";
import CreateChoice from './pages/CreateChoice';
import GenerateCharacter from './pages/GenerateCharacter';
import Template from "./pages/Template";
import Manual from "./pages/manual";         // новый ручной ввод
import ResultMain from "./pages/ResultMain";


const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create-choice" element={<CreateChoice />} />
                <Route path="/generate-character" element={<GenerateCharacter />} />
                <Route path="/template" element={<Template />} />
                <Route path="/manual" element={<Manual />} />
                <Route path="/result-main" element={<ResultMain />} />
                <Route path="/my-projects" element={<MyProjects />} />
            </Routes>
        </Router>
    );
};

export default App;
