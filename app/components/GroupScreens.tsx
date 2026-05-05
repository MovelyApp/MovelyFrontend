import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

type RequestStatus = "idle" | "loading" | "submitting" | "success" | "error";

type Group = {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  imageUrl?: string;
};

type PageResponse<T> = {
  content?: T[];
  items?: T[];
  data?: T[];
};

type MockUser = {
  id: string;
  name: string;
  username: string;
  color: "lavender" | "green" | "blue" | "pink" | "amber";
};

type PendingInvite = {
  groupId: string;
  userId: string;
  name: string;
  username: string;
  invitedAt: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";
const GROUPS_URL = API_BASE_URL ? `${API_BASE_URL}/groups` : "/api/groups";
const INVITES_STORAGE_KEY = "movely_pending_member_invites";

const mockUsers: MockUser[] = [
  { id: "user-1", name: "Lia Martins", username: "@liamove", color: "lavender" },
  { id: "user-2", name: "Caio Breno", username: "@caiotreina", color: "green" },
  { id: "user-3", name: "Nina Rocha", username: "@ninapassos", color: "blue" },
  { id: "user-4", name: "Theo Lima", username: "@theosono", color: "pink" },
  { id: "user-5", name: "Bia Torres", username: "@biaestuda", color: "amber" },
];

const initialMembers: MockUser[] = [
  { id: "member-1", name: "Maya Costa", username: "@mayahidra", color: "green" },
  { id: "member-2", name: "Rafa Nunes", username: "@rafafit", color: "lavender" },
];

function getStoredToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem("movely_token") ||
    window.sessionStorage.getItem("movely_token") ||
    window.localStorage.getItem("token") ||
    ""
  );
}

function getAuthHeaders(extra: Record<string, string> = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = { ...extra };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchJson<T>(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || response.statusText);
  }

  return responseText ? (JSON.parse(responseText) as T) : (null as T);
}

function getPageItems<T>(response: PageResponse<T> | T[] | null) {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  return response.content ?? response.items ?? response.data ?? [];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function savePendingInvite(invite: PendingInvite) {
  if (typeof window === "undefined") {
    return;
  }

  let currentInvites: PendingInvite[] = [];
  const storedInvites = window.localStorage.getItem(INVITES_STORAGE_KEY);

  if (storedInvites) {
    try {
      currentInvites = JSON.parse(storedInvites) as PendingInvite[];
    } catch {
      currentInvites = [];
    }
  }

  const nextInvites = currentInvites.filter((item) => {
    return item.groupId !== invite.groupId || item.userId !== invite.userId;
  });

  window.localStorage.setItem(
    INVITES_STORAGE_KEY,
    JSON.stringify([...nextInvites, invite]),
  );
}

function GroupAvatar({
  name,
  imageUrl,
  color = "lavender",
  large = false,
}: {
  name: string;
  imageUrl?: string;
  color?: MockUser["color"];
  large?: boolean;
}) {
  return (
    <div className={`group-avatar ${color} ${large ? "large" : ""}`}>
      {imageUrl ? <img alt="" src={imageUrl} /> : <span>{getInitials(name)}</span>}
    </div>
  );
}

function GroupTopBar({ title, backTo = "/" }: { title: string; backTo?: string }) {
  return (
    <header className="group-topbar">
      <Link aria-label="Voltar" className="group-back-button" to={backTo}>
        <span aria-hidden="true">&lt;</span>
      </Link>
      <div>
        <p>Movely grupos</p>
        <h1>{title}</h1>
      </div>
    </header>
  );
}

export function CreateGroupScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageField, setShowImageField] = useState(false);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [message, setMessage] = useState("");

  const canSubmit = name.trim().length > 0 && description.trim().length > 0;

  async function findCreatedGroupId(groupName: string) {
    try {
      const response = await fetchJson<PageResponse<Group> | Group[]>(GROUPS_URL);
      const normalizedName = groupName.trim().toLowerCase();
      const group = getPageItems(response).find((item) => {
        return item.name.trim().toLowerCase() === normalizedName;
      });

      return group?.id;
    } catch {
      return undefined;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!canSubmit) {
      setStatus("error");
      setMessage("Preencha nome e descricao para criar o grupo.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
    };

    setStatus("submitting");

    try {
      const createdGroup = await fetchJson<Partial<Group> | null>(GROUPS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const createdGroupId = createdGroup?.id ?? (await findCreatedGroupId(payload.name));

      setStatus("success");
      setMessage("Grupo criado com sucesso.");

      if (createdGroupId) {
        window.setTimeout(() => {
          navigate(`/groups/${createdGroupId}/members`);
        }, 650);
      }
    } catch {
      setStatus("error");
      setMessage("Nao foi possivel criar o grupo agora. Confira seu login e tente novamente.");
    }
  }

  return (
    <main className="group-page">
      <section className="group-phone" aria-label="Criar grupo Movely">
        <GroupTopBar title="Criar Grupo" backTo="/" />

        <form className="group-form" onSubmit={handleSubmit}>
          <button
            aria-label="Adicionar imagem do grupo"
            className="group-photo-button"
            onClick={() => setShowImageField((current) => !current)}
            type="button"
          >
            {imageUrl ? (
              <img alt="Preview do grupo" src={imageUrl} />
            ) : (
              <span aria-hidden="true">+</span>
            )}
          </button>
          <p className="group-photo-help">Toque para adicionar uma imagem ao grupo.</p>

          {showImageField && (
            <label className="field group-field">
              <span>URL da imagem</span>
              <input
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://..."
                type="url"
                value={imageUrl}
              />
            </label>
          )}

          <label className="field group-field">
            <span>Nome do grupo</span>
            <input
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Desafio da semana"
              type="text"
              value={name}
            />
          </label>

          <label className="field group-field">
            <span>Descricao</span>
            <textarea
              maxLength={220}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Conte o objetivo do grupo."
              value={description}
            />
          </label>

          <div className="group-preview-card">
            <GroupAvatar imageUrl={imageUrl || undefined} name={name || "Movely"} />
            <div>
              <p>{name || "Seu grupo Movely"}</p>
              <span>{description || "Agua, passos, sono, treino e estudo em conjunto."}</span>
            </div>
          </div>

          {message && (
            <p className={`form-message ${status}`} role="status">
              {message}
            </p>
          )}

          <button
            className="primary-button group-bottom-button"
            disabled={status === "submitting" || !canSubmit}
          >
            {status === "submitting" ? "Criando..." : "Criar Grupo"}
          </button>
        </form>
      </section>
    </main>
  );
}

export function AddMembersScreen() {
  const { id } = useParams();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState(initialMembers);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<RequestStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadGroup() {
      setStatus("loading");
      setMessage("");

      try {
        const response = await fetchJson<PageResponse<Group> | Group[]>(GROUPS_URL);
        const foundGroup = getPageItems(response).find((item) => item.id === id) ?? null;

        if (!isActive) {
          return;
        }

        setGroup(foundGroup);
        setStatus("idle");

        if (!foundGroup) {
          setMessage("Grupo nao encontrado. Voce ainda pode visualizar a tela com dados locais.");
        }
      } catch {
        if (isActive) {
          setStatus("error");
          setMessage("Nao foi possivel carregar o grupo agora. Dados locais continuam disponiveis.");
        }
      }
    }

    loadGroup();

    return () => {
      isActive = false;
    };
  }, [id]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return mockUsers;
    }

    return mockUsers.filter((user) => {
      return (
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.username.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query]);

  function handleInvite(user: MockUser) {
    if (!id) {
      return;
    }

    setInvitedIds((current) => (current.includes(user.id) ? current : [...current, user.id]));
    savePendingInvite({
      groupId: id,
      userId: user.id,
      name: user.name,
      username: user.username,
      invitedAt: new Date().toISOString(),
    });
    setMessage("");
  }

  function handleFinish() {
    setStatus("success");
    setMessage("Convites registrados localmente. Quando a rota de membros existir, eu conecto no banco.");
  }

  return (
    <main className="group-page">
      <section className="group-phone" aria-label="Adicionar membros ao grupo">
        <GroupTopBar title="Adicionar Membros" backTo="/groups/new" />

        {group && (
          <div className="group-current-card">
            <GroupAvatar imageUrl={group.imageUrl} name={group.name} />
            <div>
              <p>{group.name}</p>
              <span>{group.description}</span>
            </div>
          </div>
        )}

        {status === "loading" && (
          <p className="form-message success" role="status">
            Carregando dados do grupo...
          </p>
        )}

        {message && status !== "loading" && (
          <p className={`form-message ${status === "success" ? "success" : "error"}`} role="status">
            {message}
          </p>
        )}

        <label className="group-search" aria-label="Buscar por username">
          <span aria-hidden="true">@</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por username..."
            type="search"
            value={query}
          />
        </label>

        <section className="group-section">
          <div className="group-section-heading">
            <h2>Resultados</h2>
            <span>{filteredUsers.length}</span>
          </div>

          <div className="member-list">
            {filteredUsers.map((user) => {
              const isInvited = invitedIds.includes(user.id);

              return (
                <article className="member-row" key={user.id}>
                  <GroupAvatar color={user.color} name={user.name} />
                  <div>
                    <p>{user.name}</p>
                    <span>{user.username}</span>
                  </div>
                  <button
                    className={isInvited ? "invite-button invited" : "invite-button"}
                    disabled={isInvited}
                    onClick={() => handleInvite(user)}
                    type="button"
                  >
                    {isInvited ? "Convidado" : "Convidar"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="group-section">
          <div className="group-section-heading">
            <h2>Membros no grupo</h2>
            <span>{members.length}</span>
          </div>

          <div className="member-list">
            {members.map((member) => (
              <article className="member-row" key={member.id}>
                <GroupAvatar color={member.color} name={member.name} />
                <div>
                  <p>{member.name}</p>
                  <span>{member.username}</span>
                </div>
                <button
                  aria-label={`Remover ${member.name}`}
                  className="remove-member-button"
                  onClick={() =>
                    setMembers((current) => current.filter((item) => item.id !== member.id))
                  }
                  type="button"
                >
                  x
                </button>
              </article>
            ))}
          </div>
        </section>

        <button className="primary-button group-bottom-button" onClick={handleFinish} type="button">
          Concluir
        </button>
      </section>
    </main>
  );
}
