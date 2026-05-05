import { AddMembersScreen } from "../components/GroupScreens";

export function meta() {
  return [
    { title: "Movely | Adicionar Membros" },
    {
      name: "description",
      content: "Convide membros para um grupo Movely.",
    },
  ];
}

export default function GroupMembers() {
  return <AddMembersScreen />;
}
