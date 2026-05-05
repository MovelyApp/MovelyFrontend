import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/stats";
import BottomNav from "../components/bottomnav";
import MobileHeader from "../components/mobileheader";
import { apiFetch, getToken } from "../lib/api";

type Goal = {
  id: string;
  challengeId: string;
  name: string;
  description: string;
  type: string;
};

type Group = {
  id: string;
  name: string;
};

type GroupsResponse = {
  content?: Group[];
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Movely | Estatísticas" },
    {
      name: "description",
      content: "Acompanhe suas estatísticas no Movely.",
    },
  ];
}

export default function Stats() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    Promise.all([
      apiFetch("/api/goals").then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao buscar metas");
        }

        return response.json() as Promise<Goal[]>;
      }),
      apiFetch("/groups").then(async (response) => {
        if (!response.ok) {
          return [];
        }

        const data = (await response.json()) as GroupsResponse | Group[];
        return Array.isArray(data) ? data : data.content ?? [];
      }),
    ])
      .then(([goalsData, groupList]) => {
        setGoals(goalsData);
        setGroups(groupList);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao buscar dados");
        setLoading(false);
      });
  }, [navigate]);

  const goalTypes = useMemo(() => {
    const grouped = goals.reduce<Record<string, number>>((acc, goal) => {
      const label = getGoalLabel(goal.type);
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped);
  }, [goals]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      <MobileHeader />

      <main className="px-5">
        <section className="mb-6">
          <p className="text-sm text-[#888]">Resumo</p>
          <h1 className="text-2xl font-medium text-[#1a1a1a]">Estatísticas</h1>
        </section>

        <section className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Metas" loading={loading} value={goals.length} />
          <StatCard label="Grupos" loading={loading} value={groups.length} />
        </section>

        <section className="bg-[#EEEDFE] rounded-2xl p-5 mb-6">
          <p className="text-xs font-medium text-[#534AB7] mb-1">
            Próximo registro
          </p>
          <p className="text-xl font-medium text-[#3C3489]">
            Atualize uma meta para movimentar seu ranking.
          </p>
          <Link
            to="/register-activity"
            className="inline-block mt-4 px-4 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium"
          >
            Registrar atividade
          </Link>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
            <p className="text-sm text-red-700">Erro: {error}</p>
            <p className="text-xs text-red-600 mt-1">
              Verifique se o backend está rodando.
            </p>
          </div>
        )}

        <section>
          <h2 className="text-base font-medium text-[#1a1a1a] mb-4">
            Tipos de meta
          </h2>

          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((item) => (
                <div
                  className="h-16 bg-[#F1EFE8] rounded-2xl animate-pulse"
                  key={item}
                />
              ))}
            </div>
          )}

          {!loading && goalTypes.length === 0 && !error && (
            <div className="bg-white border border-[#EEEDFE] rounded-2xl p-8 text-center">
              <p className="text-sm text-[#888] mb-3">
                Nenhuma meta cadastrada
              </p>
              <Link
                to="/groups"
                className="inline-block px-4 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium"
              >
                Ver grupos
              </Link>
            </div>
          )}

          {!loading && goalTypes.length > 0 && (
            <div className="flex flex-col gap-3">
              {goalTypes.map(([label, count]) => (
                <div
                  className="bg-white border border-[#EEEDFE] rounded-2xl p-4 flex items-center justify-between"
                  key={label}
                >
                  <p className="text-sm font-medium text-[#1a1a1a]">{label}</p>
                  <p className="text-base font-medium text-[#534AB7]">{count}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({
  label,
  loading,
  value,
}: {
  label: string;
  loading: boolean;
  value: number;
}) {
  return (
    <div className="bg-white border border-[#EEEDFE] rounded-2xl p-5">
      <p className="text-xs font-medium text-[#888] mb-2">{label}</p>
      <p className="text-3xl font-medium text-[#3C3489]">
        {loading ? "..." : value}
      </p>
    </div>
  );
}

function getGoalLabel(type: string) {
  switch (type) {
    case "WaterGoal":
      return "Água";
    case "StepsGoal":
      return "Passos";
    case "WorkoutGoal":
      return "Treino";
    case "SleepGoal":
      return "Sono";
    case "StudyGoal":
      return "Estudo";
    default:
      return type;
  }
}
