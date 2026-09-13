import "./App.css";
import { HashRouter, Route, Routes } from "react-router-dom";
import MainPage from "./pages/MainPage";
import { ThemeProvider } from "./theme-provider";
function App() {
  return (
    <ThemeProvider>
      <div id="App">
        <HashRouter basename="/">
          <Routes>
            <Route path="/" element={<MainPage />} />
          </Routes>
        </HashRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
