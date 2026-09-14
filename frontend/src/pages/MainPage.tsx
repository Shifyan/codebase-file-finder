import { useState } from "react";
import { Header } from "./../components/MainPage/Header";
import { Body } from "./../components/MainPage/Body";
import { scanner } from "./../../wailsjs/go/models";

export default function MainPage() {
  const [results, setResults] = useState<scanner.Result[]>([]);
  const [language, setLanguage] = useState("");
  const [root, setRoot] = useState("");

  return (
    <div className="flex h-screen flex-col">
      <Header
        onResults={(found, scanned, scannedRoot) => {
          setResults(found);
          setLanguage(scanned);
          setRoot(scannedRoot);
        }}
      />
      <Body results={results} language={language} root={root} />
    </div>
  );
}
