import { AuthScreen } from "../components/AuthScreen";

export function meta() {
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
