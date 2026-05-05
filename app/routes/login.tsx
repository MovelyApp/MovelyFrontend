import { AuthScreen } from "../components/AuthScreen";

export function meta() {
  return [
    { title: "Movely | Entrar" },
    {
      name: "description",
      content: "Entre no Movely para acompanhar metas e desafios.",
    },
  ];
}

export default function Login() {
  return <AuthScreen mode="login" />;
}
