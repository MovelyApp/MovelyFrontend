import type { Route } from "./+types/registrar";
import { HabitRegisterScreen } from "../components/HabitRegisterScreen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Movely | Registrar hábito" },
    {
      name: "description",
      content: "Registre seus hábitos diários no Movely.",
    },
  ];
}

export default function Registrar() {
  return <HabitRegisterScreen />;
}
