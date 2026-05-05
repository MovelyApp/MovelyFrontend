import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { apiFetch, apiJson, getToken, readError } from "../lib/api";

type RequestStatus = "idle" | "loading" | "submitting" | "success" | "error";

type User = {
  id: number;
  username: string;
  email?: string | null;
};

type Group = {
  id: string;
  name: string;
  description?: string;
  urlImagem?: string;
  imageUrl?: string;
  users?: User[];
};

type PageResponse<T> = {
  content?: T[];
  items?: T[];
  data?: T[];
};

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

function getGroupImage(group?: Group | null) {
  return group?.urlImagem || group?.imageUrl || "";
}

function GroupAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  return (
    <div className="group-avatar lavender">
      {imageUrl ? <img alt="" src={imageUrl} /> : <span>{getInitials(name)}</span>}
    </div>
  );
}

function UserAvatar({ username, id }: { username: string; id: number }) {
  const colors = ["lavender", "green", "blue", "pink", "amber"];

  return (
    <div className={`group-avatar ${colors[id % colors.length]}`}>
      <span>{getInitials(username)}</span>
    </div>
  );
}

function GroupTopBar({ title, backTo = "/groups" }: { title: string; backTo?: string }) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!getToken()) {
      navigate("/login");
      return;
    }

    if (!canSubmit) {
      setStatus("error");
      setMessage("Preencha nome e descricao para criar o grupo.");
      return;
    }

    setStatus("submitting");

    try {
      const createdGroup = await apiJson<Group>("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          urlImagem: imageUrl.trim() || undefined,
        }),
      });

      setStatus("success");
      setMessage("Grupo criado com sucesso.");

      window.setTimeout(() => {
        navigate(createdGroup?.id ? `/groups/${createdGroup.id}/members` : "/groups");
      }, 650);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel criar o grupo.");
    }
  }

  return (
    <main className="group-page">
      <section className="group-phone" aria-label="Criar grupo Movely">
        <GroupTopBar title="Criar Grupo" />

        <form className="group-form" onSubmit={handleSubmit}>
          <button
            aria-label="Adicionar imagem do grupo"
            className="group-photo-button"
            onClick={() => setShowImageField((current) => !current)}
            type="button"
          >
            {imageUrl ? <img alt="Preview do grupo" src={imageUrl} /> : <span aria-hidden="true">+</span>}
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
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<RequestStatus>("loading");
  const [message, setMessage] = useState("");

  const members = group?.users ?? [];

  async function loadData() {
    if (!id) {
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const groupsResponse = await apiJson<PageResponse<Group> | Group[]>("/api/groups?size=100");
      const foundGroup = getPageItems(groupsResponse).find((item) => item.id === id) ?? null;

      setGroup(foundGroup);
      setStatus(foundGroup ? "idle" : "error");
      setMessage(foundGroup ? "" : "Grupo nao encontrado.");

      try {
        const usersResponse = await apiJson<PageResponse<User> | User[]>("/api/users");
        setUsers(getPageItems(usersResponse));
      } catch {
        setUsers([]);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o grupo.");
    }
  }

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    loadData();
  }, [id, navigate]);

  const filteredUsers = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.id));
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        user.username.toLowerCase().includes(normalizedQuery) ||
        (user.email || "").toLowerCase().includes(normalizedQuery) ||
        String(user.id).includes(normalizedQuery);

      return matchesQuery && !memberIds.has(user.id);
    });
  }, [members, query, users]);

  async function handleGroupUser(
    action: "add" | "remove",
    user: { userId?: number; email?: string },
  ) {
    if (!id) {
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await apiFetch(`/api/groups/${action}`, {
        method: "POST",
        body: JSON.stringify({
          groupId: id,
          userId: user.userId,
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Nao foi possivel atualizar o grupo."));
      }

      const updatedGroup = (await response.json()) as Group;
      setGroup(updatedGroup);
      setMemberEmail("");
      setStatus("success");
      setMessage(action === "add" ? "Membro adicionado ao grupo." : "Membro removido do grupo.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar o grupo.");
    }
  }

  function handleAddByEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = memberEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Digite o email da pessoa.");
      return;
    }

    handleGroupUser("add", { email: normalizedEmail });
  }

  return (
    <main className="group-page">
      <section className="group-phone" aria-label="Adicionar membros ao grupo">
        <GroupTopBar title="Adicionar Membros" />

        {group && (
          <div className="group-current-card">
            <GroupAvatar imageUrl={getGroupImage(group)} name={group.name} />
            <div>
              <p>{group.name}</p>
              <span>{group.description || "Grupo Movely"}</span>
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

        <form className="member-id-form" onSubmit={handleAddByEmail}>
          <label className="field group-field">
            <span>Email do membro</span>
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setMemberEmail(event.target.value)}
              placeholder="pessoa@email.com"
              type="email"
              value={memberEmail}
            />
          </label>
          <button
            className="invite-button member-id-button"
            disabled={status === "submitting"}
            type="submit"
          >
            {status === "submitting" ? "Adicionando..." : "Adicionar"}
          </button>
          <p>Use o mesmo email que a pessoa usa para entrar no Movely.</p>
        </form>

        <section className="group-section">
          <div className="group-section-heading">
            <h2>Usuarios encontrados</h2>
            <span>{filteredUsers.length}</span>
          </div>

          <label className="group-search" aria-label="Buscar por email">
            <span aria-hidden="true">@</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por email..."
              type="search"
              value={query}
            />
          </label>

          <div className="member-list">
            {filteredUsers.map((user) => (
              <article className="member-row" key={user.id}>
                <UserAvatar id={user.id} username={user.username} />
                <div>
                  <p>{user.username}</p>
                  <span>{user.email || user.username}</span>
                </div>
                <button
                  className="invite-button"
                  disabled={status === "submitting"}
                  onClick={() => handleGroupUser("add", { email: user.email || user.username })}
                  type="button"
                >
                  Adicionar
                </button>
              </article>
            ))}
            {users.length === 0 && (
              <div className="member-empty">
                <strong>Use o email para adicionar</strong>
                <span>A busca e opcional; o convite por email continua funcionando.</span>
              </div>
            )}
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
                <UserAvatar id={member.id} username={member.username} />
                <div>
                  <p>{member.username}</p>
                  <span>{member.email || member.username}</span>
                </div>
                <button
                  aria-label={`Remover ${member.username}`}
                  className="remove-member-button"
                  disabled={status === "submitting"}
                  onClick={() => handleGroupUser("remove", { userId: member.id })}
                  type="button"
                >
                  x
                </button>
              </article>
            ))}
          </div>
        </section>

        <Link className="primary-button group-bottom-button" to="/groups">
          Concluir
        </Link>
      </section>
    </main>
  );
}
