import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/groups";
import BottomNav from "../components/bottomnav";
import MobileHeader from "../components/mobileheader";
import { apiFetch, getToken } from "../lib/api";

type Group = {
  id: string;
  name: string;
  description?: string;
  urlImagem?: string;
};

type GroupsResponse = {
  content?: Group[];
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Movely | Grupos" },
    {
      name: "description",
      content: "Veja seus grupos no Movely.",
    },
  ];
}

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    apiFetch("/groups")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Erro ao buscar grupos");
        }

        const data = (await response.json()) as GroupsResponse | Group[];
        return Array.isArray(data) ? data : data.content ?? [];
      })
      .then((groupList) => {
        setGroups(groupList);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao buscar grupos");
        setLoading(false);
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      <MobileHeader />

      <main className="px-5">
        <section className="mb-6">
          <p className="text-sm text-[#888]">Movely</p>
          <h1 className="text-2xl font-medium text-[#1a1a1a]">Grupos</h1>
        </section>

        <section className="bg-[#3C3489] rounded-2xl p-6 mb-6 text-white">
          <p className="text-sm font-medium text-[#CECBF6] mb-2">
            Grupos ativos
          </p>
          <p className="text-5xl font-medium">{loading ? "..." : groups.length}</p>
          <p className="text-xs text-[#AFA9EC] mt-2">
            Escolha um grupo no registro para pontuar nele.
          </p>
        </section>

        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-medium text-[#1a1a1a]">
              Seus grupos
            </h2>
            <Link
              to="/register-activity"
              className="text-xs text-[#534AB7] hover:text-[#3C3489] font-medium"
            >
              Registrar
            </Link>
          </div>

          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((item) => (
                <div
                  className="h-20 bg-[#F1EFE8] rounded-2xl animate-pulse"
                  key={item}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <p className="text-sm text-red-700">Erro: {error}</p>
              <p className="text-xs text-red-600 mt-1">
                Verifique se o backend está rodando.
              </p>
            </div>
          )}

          {!loading && !error && groups.length === 0 && (
            <div className="bg-white border border-[#EEEDFE] rounded-2xl p-8 text-center">
              <p className="text-sm text-[#888] mb-3">
                Nenhum grupo encontrado
              </p>
              <Link
                to="/dashboard"
                className="inline-block px-4 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium"
              >
                Voltar ao início
              </Link>
            </div>
          )}

          {!loading && !error && groups.length > 0 && (
            <div className="flex flex-col gap-3">
              {groups.map((group) => (
                <GroupCard group={group} key={group.id} />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  return (
    <Link
      to="/register-activity"
      className="bg-white border border-[#EEEDFE] rounded-2xl p-4 flex items-center gap-3"
    >
      {group.urlImagem ? (
        <img
          alt=""
          className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
          src={group.urlImagem}
        />
      ) : (
        <div className="w-12 h-12 rounded-2xl bg-[#534AB7] text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
          {group.name.trim().charAt(0).toUpperCase() || "M"}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1a1a1a] truncate">
          {group.name}
        </p>
        <p className="text-xs text-[#888] truncate">
          {group.description || "Grupo Movely"}
        </p>
      </div>

      <span className="text-xs text-[#534AB7] font-medium flex-shrink-0">
        Registrar
      </span>
    </Link>
  );
}
