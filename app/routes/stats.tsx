import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import BottomNav from "../components/bottomnav";
import MobileHeader from "../components/mobileheader";
import { apiFetch, getToken, readError } from "../lib/api";

const POINTS_PER_REGISTER = 80;

type User = {
  id: number;
  username: string;
  email?: string | null;
};

type RegisterEntry = {
  id: number;
  groupId?: string;
  userId?: number;
  user?: User;
  dateTime?: string;
  notes?: string;
  description?: string;
  ml?: number;
  steps?: number;
  hours?: number;
  quality?: number;
  workoutType?: string;
  durationMin?: number;
};

type Group = {
  id: string;
  name: string;
  description?: string;
  users?: User[];
};

type GroupsResponse = {
  content?: Group[];
};

type RankingRow = {
  user: User;
  todayCount: number;
  totalCount: number;
  todayPoints: number;
  totalPoints: number;
};

export function meta() {
  return [
    { title: "Movely | Estatisticas" },
    {
      name: "description",
      content: "Acompanhe suas estatisticas no Movely.",
    },
  ];
}

export default function Stats() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [registersByGroup, setRegistersByGroup] = useState<Record<string, RegisterEntry[]>>({});
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedRegister, setSelectedRegister] = useState<RegisterEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    apiFetch("/api/groups?size=100")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readError(response, "Não foi possível carregar seus grupos."));
        }

        const data = (await response.json()) as GroupsResponse | Group[];
        const groupList = Array.isArray(data) ? data : data.content ?? [];

        const registerEntries = await Promise.all(
          groupList.map(async (group) => {
            const registersResponse = await apiFetch(`/api/registers/group/${group.id}`);

            if (!registersResponse.ok) {
              throw new Error(await readError(registersResponse, "Não foi possível carregar os registros do grupo."));
            }

            const registers = (await registersResponse.json()) as RegisterEntry[];
            return [group.id, registers] as const;
          }),
        );

        setGroups(groupList);
        setRegistersByGroup(Object.fromEntries(registerEntries));
        setSelectedGroupId((current) => current || groupList[0]?.id || "");
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Não foi possível carregar as estatísticas.");
        setLoading(false);
      });
  }, [navigate]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null,
    [groups, selectedGroupId],
  );

  const selectedRegisters = selectedGroup ? registersByGroup[selectedGroup.id] ?? [] : [];
  const uniqueSelectedRegisters = useMemo(
    () => dedupeRegistersByActivity(selectedRegisters),
    [selectedRegisters],
  );

  const ranking = useMemo(
    () => buildRanking(selectedGroup, uniqueSelectedRegisters),
    [selectedGroup, uniqueSelectedRegisters],
  );

  const timeline = useMemo(() => buildTimeline(uniqueSelectedRegisters), [uniqueSelectedRegisters]);
  const leader = ranking[0] ?? null;
  const todayGroupPoints = ranking.reduce((sum, row) => sum + row.todayPoints, 0);
  const totalGroupPoints = ranking.reduce((sum, row) => sum + row.totalPoints, 0);
  const recentRegisters = useMemo(
    () =>
      [...uniqueSelectedRegisters]
        .sort((a, b) => new Date(b.dateTime ?? 0).getTime() - new Date(a.dateTime ?? 0).getTime())
        .slice(0, 10),
    [uniqueSelectedRegisters],
  );
  const maxTodayPoints = Math.max(...ranking.map((row) => row.todayPoints), 1);
  const maxTotalPoints = Math.max(...ranking.map((row) => row.totalPoints), 1);
  const maxTimelinePoints = Math.max(...timeline.map((day) => day.points), 1);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      <MobileHeader />

      <main className="px-5">
        <section className="mb-6">
          <p className="text-sm text-[#888]">Resumo</p>
          <h1 className="text-2xl font-medium text-[#1a1a1a]">Estatisticas</h1>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-1">
              Atualize a página ou entre novamente.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div className="h-24 bg-[#F1EFE8] rounded-2xl animate-pulse" key={item} />
            ))}
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="bg-white border border-[#EEEDFE] rounded-2xl p-8 text-center">
            <p className="text-sm text-[#888] mb-3">
              Voce ainda nao esta em nenhum grupo.
            </p>
            <Link
              to="/groups/new"
              className="inline-block px-4 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium"
            >
              Criar grupo
            </Link>
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <>
            <section className="mb-6">
              <p className="text-xs font-medium text-[#888] mb-2">Grupo</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {groups.map((group) => {
                  const active = group.id === selectedGroup?.id;

                  return (
                    <button
                      className={`h-10 px-4 rounded-xl text-sm font-medium flex-shrink-0 ${
                        active
                          ? "bg-[#534AB7] text-white"
                          : "bg-white border border-[#EEEDFE] text-[#534AB7]"
                      }`}
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      type="button"
                    >
                      {group.name}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-[#3C3489] rounded-2xl p-6 mb-6 text-white">
              <p className="text-sm font-medium text-[#CECBF6] mb-2">
                Lider do grupo
              </p>
              <p className="text-3xl font-medium truncate">
                {leader ? getDisplayName(leader.user) : "Sem pontos"}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="rounded-xl bg-[#534AB7] p-3">
                  <p className="text-xs text-[#CECBF6] mb-1">Hoje</p>
                  <p className="text-2xl font-medium">{leader?.todayPoints ?? 0}</p>
                </div>
                <div className="rounded-xl bg-[#534AB7] p-3">
                  <p className="text-xs text-[#CECBF6] mb-1">Total</p>
                  <p className="text-2xl font-medium">{leader?.totalPoints ?? 0}</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 mb-6">
              <StatCard label="Pontos hoje" value={todayGroupPoints} />
              <StatCard label="Total acumulado" value={totalGroupPoints} />
            </section>

            <section className="bg-white border border-[#EEEDFE] rounded-2xl p-5 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-medium text-[#1a1a1a]">
                  Evolucao do grupo
                </h2>
                <span className="text-xs text-[#888]">7 dias</span>
              </div>

              <div className="h-36 flex items-end gap-2">
                {timeline.map((day) => (
                  <div className="flex-1 min-w-0 flex flex-col items-center gap-2" key={day.key}>
                    <div className="w-full h-24 flex items-end">
                      <div
                        className="w-full rounded-t-lg bg-[#534AB7]"
                        style={{ height: `${Math.max((day.points / maxTimelinePoints) * 100, day.points ? 10 : 3)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#888] truncate">{day.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-medium text-[#1a1a1a]">
                  Ranking do grupo
                </h2>
                <span className="text-xs text-[#534AB7] font-medium">
                  {ranking.length} membro{ranking.length === 1 ? "" : "s"}
                </span>
              </div>

              {ranking.length === 0 && (
                <div className="bg-white border border-[#EEEDFE] rounded-2xl p-8 text-center">
                  <p className="text-sm text-[#888] mb-3">
                    Esse grupo ainda nao tem membros com pontos.
                  </p>
                  <Link
                    to="/register-activity"
                    className="inline-block px-4 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium"
                  >
                    Registrar atividade
                  </Link>
                </div>
              )}

              {ranking.length > 0 && (
                <div className="flex flex-col gap-3">
                  {ranking.map((row, index) => (
                    <RankingCard
                      index={index}
                      key={row.user.id}
                      maxTodayPoints={maxTodayPoints}
                      maxTotalPoints={maxTotalPoints}
                      row={row}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-medium text-[#1a1a1a]">
                  Registros recentes
                </h2>
                <span className="text-xs text-[#534AB7] font-medium">
                  {recentRegisters.length}
                </span>
              </div>

              {recentRegisters.length === 0 && (
                <div className="bg-white border border-[#EEEDFE] rounded-2xl p-8 text-center">
                  <p className="text-sm text-[#888]">
                    Nenhum registro nesse grupo ainda.
                  </p>
                </div>
              )}

              {recentRegisters.length > 0 && (
                <div className="flex flex-col gap-3">
                  {recentRegisters.map((register) => (
                    <button
                      className="w-full text-left bg-white border border-[#EEEDFE] rounded-2xl p-4"
                      key={register.id}
                      onClick={() => setSelectedRegister(register)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a] truncate">
                            {getRegisterLabel(register)} - {getRegisterValue(register)}
                          </p>
                          <p className="text-xs text-[#888] truncate">
                            {getDisplayName(register.user ?? { id: 0, username: "Movely" })}
                          </p>
                        </div>
                        <span className="text-xs text-[#534AB7] font-medium flex-shrink-0">
                          {formatRegisterDate(register.dateTime)}
                        </span>
                      </div>
                      {getRegisterNotes(register) && (
                        <p className="text-xs text-[#888] mt-3 line-clamp-2">
                          {getRegisterNotes(register)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {selectedRegister && (
        <RegisterDetailsSheet
          onClose={() => setSelectedRegister(null)}
          register={selectedRegister}
        />
      )}

      <BottomNav />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-[#EEEDFE] rounded-2xl p-5">
      <p className="text-xs font-medium text-[#888] mb-2">{label}</p>
      <p className="text-3xl font-medium text-[#3C3489]">{value}</p>
    </div>
  );
}

function RankingCard({
  index,
  maxTodayPoints,
  maxTotalPoints,
  row,
}: {
  index: number;
  maxTodayPoints: number;
  maxTotalPoints: number;
  row: RankingRow;
}) {
  return (
    <article className="bg-white border border-[#EEEDFE] rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#CECBF6] text-[#3C3489] flex items-center justify-center text-sm font-medium flex-shrink-0">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#1a1a1a] truncate">
            {getDisplayName(row.user)}
          </p>
          <p className="text-xs text-[#888] truncate">
            {row.todayPoints} hoje - {row.totalPoints} total
          </p>
        </div>
        <p className="text-lg font-medium text-[#534AB7] flex-shrink-0">
          {row.totalPoints}
        </p>
      </div>

      <ScoreBar
        color="#534AB7"
        label="Hoje"
        value={row.todayPoints}
        width={(row.todayPoints / maxTodayPoints) * 100}
      />
      <ScoreBar
        color="#3C3489"
        label="Total"
        value={row.totalPoints}
        width={(row.totalPoints / maxTotalPoints) * 100}
      />
    </article>
  );
}

function ScoreBar({
  color,
  label,
  value,
  width,
}: {
  color: string;
  label: string;
  value: number;
  width: number;
}) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#888]">{label}</span>
        <span className="text-[#534AB7] font-medium">{value}</span>
      </div>
      <div className="h-2 bg-[#EEEDFE] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: `${Math.max(width, value ? 8 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function RegisterDetailsSheet({
  onClose,
  register,
}: {
  onClose: () => void;
  register: RegisterEntry;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end px-4 pb-24">
      <section className="w-full max-w-md mx-auto bg-white rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-medium text-[#534AB7] mb-1">
              {getRegisterLabel(register)}
            </p>
            <h2 className="text-xl font-medium text-[#1a1a1a]">
              {getRegisterValue(register)}
            </h2>
          </div>
          <button
            className="w-9 h-9 rounded-full bg-[#EEEDFE] text-[#534AB7] text-sm font-medium"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#FAFAF8] border border-[#EEEDFE] rounded-2xl p-3">
            <p className="text-xs text-[#888] mb-1">Pessoa</p>
            <p className="text-sm font-medium text-[#1a1a1a] truncate">
              {getDisplayName(register.user ?? { id: 0, username: "Movely" })}
            </p>
          </div>
          <div className="bg-[#FAFAF8] border border-[#EEEDFE] rounded-2xl p-3">
            <p className="text-xs text-[#888] mb-1">Quando</p>
            <p className="text-sm font-medium text-[#1a1a1a]">
              {formatRegisterDate(register.dateTime)}
            </p>
          </div>
        </div>

        <div className="bg-[#EEEDFE] rounded-2xl p-4">
          <p className="text-xs font-medium text-[#534AB7] mb-2">Observacao</p>
          <p className="text-sm text-[#3C3489]">
            {getRegisterNotes(register) || "Sem observacao nesse registro."}
          </p>
        </div>
      </section>
    </div>
  );
}

function buildRanking(group: Group | null, registers: RegisterEntry[]) {
  const users = new Map<number, User>();

  group?.users?.forEach((user) => {
    if (user.id) {
      users.set(user.id, user);
    }
  });

  registers.forEach((register) => {
    if (register.user?.id) {
      users.set(register.user.id, register.user);
    }
  });

  return Array.from(users.values())
    .map((user) => {
      const userRegisters = registers.filter((register) => getRegisterUserId(register) === user.id);
      const todayCount = userRegisters.filter(isTodayRegister).length;
      const totalCount = userRegisters.length;

      return {
        user,
        todayCount,
        totalCount,
        todayPoints: todayCount * POINTS_PER_REGISTER,
        totalPoints: totalCount * POINTS_PER_REGISTER,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      if (b.todayPoints !== a.todayPoints) {
        return b.todayPoints - a.todayPoints;
      }

      return getDisplayName(a.user).localeCompare(getDisplayName(b.user));
    });
}

function buildTimeline(registers: RegisterEntry[]) {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);

    const count = registers.filter((register) => isSameDay(register.dateTime, date)).length;

    return {
      key: date.toISOString(),
      label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      points: count * POINTS_PER_REGISTER,
    };
  });
}

function getRegisterUserId(register: RegisterEntry) {
  return register.user?.id ?? register.userId ?? 0;
}

function getDisplayName(user: User) {
  return user.email || user.username || "Movely";
}

function dedupeRegistersByActivity(registers: RegisterEntry[]) {
  const seen = new Set<string>();

  return registers.filter((register) => {
    const key = getRegisterFingerprint(register);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getRegisterFingerprint(register: RegisterEntry) {
  const minute = getRegisterMinute(register.dateTime);
  const userId = getRegisterUserId(register);
  const label = getRegisterLabel(register);
  const notes = getRegisterNotes(register).trim().toLowerCase();

  if (typeof register.ml === "number") {
    return `${minute}|user:${userId}|${label}|ml:${register.ml}|${notes}`;
  }

  if (typeof register.steps === "number") {
    return `${minute}|user:${userId}|${label}|steps:${register.steps}|${notes}`;
  }

  if (register.workoutType || typeof register.durationMin === "number") {
    return `${minute}|user:${userId}|${label}|workout:${register.workoutType ?? ""}|duration:${register.durationMin ?? ""}|${notes}`;
  }

  if (typeof register.quality === "number") {
    return `${minute}|user:${userId}|${label}|hours:${register.hours ?? ""}|quality:${register.quality}|${notes}`;
  }

  if (typeof register.hours === "number") {
    return `${minute}|user:${userId}|${label}|hours:${register.hours}|${notes}`;
  }

  return `id:${register.id}`;
}

function getRegisterMinute(dateTime?: string) {
  if (!dateTime) {
    return "sem-data";
  }

  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  return date.toISOString().slice(0, 16);
}

function getRegisterLabel(register: RegisterEntry) {
  if (typeof register.ml === "number") {
    return "Agua";
  }

  if (typeof register.steps === "number") {
    return "Passos";
  }

  if (register.workoutType || typeof register.durationMin === "number") {
    return "Treino";
  }

  if (typeof register.quality === "number") {
    return "Sono";
  }

  if (typeof register.hours === "number") {
    return "Estudo";
  }

  return "Registro";
}

function getRegisterValue(register: RegisterEntry) {
  if (typeof register.ml === "number") {
    return `${register.ml} ml`;
  }

  if (typeof register.steps === "number") {
    return `${register.steps} passos`;
  }

  if (register.workoutType || typeof register.durationMin === "number") {
    const duration = typeof register.durationMin === "number" ? `${register.durationMin} min` : "Treino";
    return register.workoutType ? `${register.workoutType} - ${duration}` : duration;
  }

  if (typeof register.quality === "number") {
    return `${register.hours ?? 0} h - qualidade ${register.quality}/5`;
  }

  if (typeof register.hours === "number") {
    return `${register.hours} h`;
  }

  return "Detalhes";
}

function getRegisterNotes(register: RegisterEntry) {
  return register.notes || register.description || "";
}

function formatRegisterDate(dateTime?: string) {
  if (!dateTime) {
    return "--/--";
  }

  return new Date(dateTime).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function isTodayRegister(register: RegisterEntry) {
  if (!register.dateTime) {
    return false;
  }

  return isSameDay(register.dateTime, new Date());
}

function isSameDay(dateTime: string | undefined, targetDate: Date) {
  if (!dateTime) {
    return false;
  }

  const date = new Date(dateTime);

  return (
    date.getFullYear() === targetDate.getFullYear() &&
    date.getMonth() === targetDate.getMonth() &&
    date.getDate() === targetDate.getDate()
  );
}
