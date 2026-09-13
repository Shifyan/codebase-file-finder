import { Header } from "./../components/MainPage/Header";
import { Body } from "./../components/MainPage/Body";

export default function MainPage() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <Body />
    </div>
  );
}
