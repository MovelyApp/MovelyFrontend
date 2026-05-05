import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
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

export default function Dashboard() {
    const navigate = useNavigate();
    const [username, setUsername] = useState<string>("");
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!getToken()) {
            navigate("/login");
            return;
        }

        apiFetch("/me").then((response) => {
            if (!response.status || response.status >= 400) {
                throw new Error("Erro ao buscar informações do usuário");
            }
            return response.data;
        }).then((data) => {
            console.log("User data:", data);
            setUsername(data.username);
        }).catch((err) => {
            setError(err.message);
        });

        apiFetch("/api/goals").then((response) => {
            if (!response.status || response.status >= 400) {
                throw new Error("Erro ao buscar metas");
            }
            setGoals(response.data || []);
            setLoading(false);
        }).catch((err) => {
            setError(err.message);
            setLoading(false);
        });
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#FAFAF8] pb-24">

            <MobileHeader />

            <main className="px-5">

                <section className="mb-6">
                    <p className="text-sm text-[#888]">Bom dia,</p>
                    <h1 className="text-2xl font-medium text-[#1a1a1a]">
                        {username || "..."}
                    </h1>
                </section>

                <section className="bg-[#3C3489] rounded-2xl p-6 mb-6 text-white">
                    <div className="flex justify-between items-baseline mb-3">
                        <p className="text-sm font-medium text-[#CECBF6]">Pontos hoje</p>
                        <p className="text-xs text-[#AFA9EC]">+ 80 que ontem</p>
                    </div>
                    <p className="text-5xl font-medium mb-4">340</p>
                    <div className="h-1.5 bg-[#534AB7] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full"
                            style={{ width: "65%" }}
                        />
                    </div>
                    <p className="text-xs text-[#AFA9EC] mt-2">65% do objetivo diário</p>
                </section>

                <section className="bg-[#EEEDFE] rounded-2xl p-5 mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#534AB7] mb-1">Sequência</p>
                        <p className="text-2xl font-medium text-[#3C3489]">7 dias 🔥</p>
                    </div>
                    <p className="text-xs text-[#534AB7] max-w-[40%] text-right">
                        Continue assim!
                    </p>
                </section>

                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-medium text-[#1a1a1a]">
                            Metas de hoje
                        </h2>
                        <Link
                            to="/groups"
                            className="text-xs text-[#534AB7] hover:text-[#3C3489] font-medium"
                        >
                            Ver todas →
                        </Link>
                    </div>

                    {loading && (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-20 bg-[#F1EFE8] rounded-2xl animate-pulse"
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

                    {!loading && !error && goals.length === 0 && (
                        <div className="bg-white border border-[#EEEDFE] rounded-2xl p-8 text-center">
                            <p className="text-sm text-[#888] mb-3">
                                Nenhuma meta cadastrada
                            </p>
                            <Link
                                to="/groups"
                                className="inline-block px-4 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium"
                            >
                                Criar primeira meta
                            </Link>
                        </div>
                    )}

                    {!loading && !error && goals.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {goals.map((goal) => (
                                <GoalCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                    )}
                </section>

            </main>

            <BottomNav />

        </div>
    );
}

function GoalCard({ goal }: { goal: Goal }) {
    const config = getGoalStyle(goal.type);

    return (
        <div className="bg-white border border-[#EEEDFE] rounded-2xl p-4 flex items-center gap-3">

            <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: config.bg }}
            >
                {config.icon}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1a1a] truncate">
                    {config.label}
                </p>
                <p className="text-xs text-[#888] truncate">{goal.name}</p>
                <div className="h-1 bg-[#F1EFE8] rounded-full overflow-hidden mt-2">
                    <div
                        className="h-full rounded-full"
                        style={{ width: "0%", backgroundColor: config.fg }}
                    />
                </div>
            </div>

            <p
                className="text-base font-medium flex-shrink-0"
                style={{ color: config.fg }}
            >
                0%
            </p>

        </div>
    );
}

function getGoalStyle(type: string) {
    switch (type) {
        case "WaterGoal":
            return { label: "Água", icon: "💧", bg: "#EEEDFE", fg: "#534AB7" };
        case "StepsGoal":
            return { label: "Passos", icon: "👟", bg: "#EEEDFE", fg: "#534AB7" };
        case "WorkoutGoal":
            return { label: "Treino", icon: "🏋️", bg: "#EEEDFE", fg: "#534AB7" };
        case "SleepGoal":
            return { label: "Sono", icon: "🌙", bg: "#EEEDFE", fg: "#534AB7" };
        case "StudyGoal":
            return { label: "Estudo", icon: "📖", bg: "#EEEDFE", fg: "#534AB7" };
        default:
            return { label: type, icon: "🎯", bg: "#EEEDFE", fg: "#534AB7" };
    }
}