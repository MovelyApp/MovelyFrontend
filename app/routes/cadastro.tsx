import type { Route } from "./+types/cadastro";
import { AuthScreen } from "../components/AuthScreen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Movely | Cadastro" },
    {
      name: "description",
      content: "Crie sua conta no Movely.",
    },
  ];
}

export default function Cadastro() {
  return <AuthScreen mode="register" />;
}
