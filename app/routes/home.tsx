import type { Route } from "./+types/home";
import { WelcomeScreen } from "../components/WelcomeScreen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Movely | Bem-vindo" },
    {
      name: "description",
      content: "Conheça o Movely antes de entrar.",
    },
  ];
}

export default function Home() {
  return <WelcomeScreen />;
}
