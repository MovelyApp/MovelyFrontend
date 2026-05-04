import { CreateGroupScreen } from "../components/GroupScreens";

export function meta() {
  return [
    { title: "Movely | Criar Grupo" },
    {
      name: "description",
      content: "Crie um grupo para desafios coletivos no Movely.",
    },
  ];
}

export default function GroupsNew() {
  return <CreateGroupScreen />;
}
