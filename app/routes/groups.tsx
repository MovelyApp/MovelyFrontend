import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import BottomNav from "../components/bottomnav";
import MobileHeader from "../components/mobileheader";
import { apiFetch, getToken, readError } from "../lib/api";

type Group = {
  id: string;
  name: string;
  description?: string;
  urlImagem?: string;
  imageUrl?: string;
};

type GroupsResponse = {
  content?: Group[];
};

type GroupInvite = {
  id: number;
  groupId: string;
  groupName: string;
  invitedByEmail?: string;
  status: string;
};

export function meta() {
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
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingInviteId, setActingInviteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadGroupsAndInvites() {
    setLoading(true);
    setError(null);

    try {
      const [groupsResponse, invitesResponse] = await Promise.all([
        apiFetch("/api/groups"),
        apiFetch("/api/groups/invites/mine"),
      ]);

      if (!groupsResponse.ok) {
        throw new Error(await readError(groupsResponse, "Não foi possível carregar seus grupos."));
      }

      const groupsData = (await groupsResponse.json()) as GroupsResponse | Group[];
      setGroups(Array.isArray(groupsData) ? groupsData : groupsData.content ?? []);

      if (invitesResponse.ok) {
        setInvites((await invitesResponse.json()) as GroupInvite[]);
      } else {
        setInvites([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar seus grupos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    loadGroupsAndInvites();
  }, [navigate]);

  async function handleInviteAction(inviteId: number, action: "accept" | "decline") {
    setActingInviteId(inviteId);
    setError(null);

    try {
      const response = await apiFetch(`/api/groups/invites/${inviteId}/${action}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Não foi possível responder o convite."));
      }

      await loadGroupsAndInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível responder o convite.");
    } finally {
      setActingInviteId(null);
    }
  }

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

        {invites.length > 0 && (
          <section className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium text-[#1a1a1a]">
                Convites pendentes
              </h2>
              <span className="text-xs text-[#534AB7] font-medium">
                {invites.length}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {invites.map((invite) => (
                <article
                  className="bg-white border border-[#CECBF6] rounded-2xl p-4"
                  key={invite.id}
                >
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    {invite.groupName}
                  </p>
                  <p className="text-xs text-[#888] mt-1">
                    Convite de {invite.invitedByEmail || "Movely"}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button
                      className="flex-1 h-10 rounded-xl bg-[#534AB7] text-white text-xs font-medium disabled:opacity-60"
                      disabled={actingInviteId === invite.id}
                      onClick={() => handleInviteAction(invite.id, "accept")}
                      type="button"
                    >
                      Aceitar
                    </button>
                    <button
                      className="flex-1 h-10 rounded-xl border border-[#CECBF6] text-[#534AB7] text-xs font-medium disabled:opacity-60"
                      disabled={actingInviteId === invite.id}
                      onClick={() => handleInviteAction(invite.id, "decline")}
                      type="button"
                    >
                      Recusar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-medium text-[#1a1a1a]">
              Seus grupos
            </h2>
            <Link
              to="/groups/new"
              className="text-xs text-[#534AB7] hover:text-[#3C3489] font-medium"
            >
              Novo grupo
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
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Atualize a página e tente novamente.
              </p>
            </div>
          )}

          {!loading && !error && groups.length === 0 && (
            <div className="bg-white border border-[#EEEDFE] rounded-2xl p-8 text-center">
              <p className="text-sm text-[#888] mb-3">
                Nenhum grupo encontrado
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
      to={`/groups/${group.id}/members`}
      className="bg-white border border-[#EEEDFE] rounded-2xl p-4 flex items-center gap-3"
    >
      {group.urlImagem || group.imageUrl ? (
        <img
          alt=""
          className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
          src={group.urlImagem || group.imageUrl}
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
        Membros
      </span>
    </Link>
  );
}
