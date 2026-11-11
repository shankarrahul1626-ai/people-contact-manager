import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  BriefcaseBusiness,
  Check,
  CircleHelp,
  LogOut,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  UsersRound,
  X,
} from "lucide-react";

const emptyContact = {
  name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  notes: "",
  favorite: false,
};

const avatarColors = ["peach", "lilac", "mint", "blue", "rose", "gold"];

async function request(path, options) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new Error("Can't reach the server. Check that the API is running.");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.message || "The request couldn't be completed.");
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function AuthScreen({ onAuthenticate, error }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event) {
    event.preventDefault();
    setFormError("");
    if (isSignup && password !== confirmPassword) {
      setFormError("Those passwords don’t match yet.");
      return;
    }

    setSubmitting(true);
    try {
      await onAuthenticate(mode, email.trim(), password);
    } catch (submitError) {
      setFormError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setFormError("");
  }

  return (
    <main className="auth-screen">
      <section className="auth-story">
        <a className="brand auth-brand" href="/" aria-label="People home">
          <span className="brand-mark"><UsersRound size={20} strokeWidth={2.2} /></span>
          <span>people<span className="brand-period">.</span></span>
        </a>
        <div className="auth-story-content">
          <p className="eyebrow">YOUR PEOPLE, IN ONE PLACE</p>
          <h1>A little closer to the people who matter.</h1>
          <p className="auth-story-copy">Keep the important details, little reminders, and favorite people all together.</p>
          <div className="auth-preview" aria-hidden="true">
            <div className="preview-avatars">
              <span className="avatar avatar-peach">A</span>
              <span className="avatar avatar-lilac">J</span>
              <span className="avatar avatar-mint">M</span>
              <span className="avatar avatar-blue">S</span>
            </div>
            <div><strong>Good connections, kept close.</strong><span>Your circle is waiting for you.</span></div>
            <Star size={17} className="preview-star" fill="currentColor" />
          </div>
        </div>
        <span className="auth-story-footer">Made for meaningful connections <span className="footer-heart">♥</span></span>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <span className="brand-mark"><UsersRound size={20} strokeWidth={2.2} /></span>
            <span>people<span className="brand-period">.</span></span>
          </div>
          <p className="eyebrow">{isSignup ? "START YOUR CIRCLE" : "WELCOME BACK"}</p>
          <h2>{isSignup ? "Create your account" : "Sign in to your space"}</h2>
          <p className="auth-form-subtitle">{isSignup ? "Your contacts are yours alone. Let’s get started." : "Your people are right where you left them."}</p>

          <form className="auth-form" onSubmit={submit}>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                required
                maxLength="254"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength="8"
                maxLength="128"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isSignup ? "At least 8 characters" : "Your password"}
              />
            </label>
            {isSignup && (
              <label className="field">
                <span>Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength="8"
                  maxLength="128"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Type it once more"
                />
              </label>
            )}
            {(formError || error) && <p className="form-error" role="alert">{formError || error}</p>}
            <button type="submit" className="button button-primary auth-submit" disabled={submitting}>
              {submitting ? "One moment…" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "New to People?"}{" "}
            <button type="button" onClick={() => changeMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>
          <p className="auth-security"><span className="status-dot" /> Your account and contacts stay private.</p>
        </div>
      </section>
    </main>
  );
}

function ContactDialog({ contact, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(contact || emptyContact);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Add a name to save this contact.");
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setFormError("Add an email address or phone number so you can reach them.");
      return;
    }
    setFormError("");
    await onSave({ ...form, name: form.name.trim() });
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{contact ? "YOUR ADDRESS BOOK" : "MAKE A CONNECTION"}</p>
            <h2 id="dialog-title">{contact ? "Edit contact" : "Add a new contact"}</h2>
            <p className="dialog-subtitle">A few details go a long way.</p>
          </div>
          <button className="icon-button dialog-close" onClick={onClose} aria-label="Close dialog">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field full-field">
              <span>Name <b>*</b></span>
              <input autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Alex Morgan" maxLength="100" />
            </label>
            <label className="field">
              <span>Email address</span>
              <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="alex@example.com" maxLength="254" />
            </label>
            <label className="field">
              <span>Phone number</span>
              <input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+1 (555) 000-0000" maxLength="40" />
            </label>
            <label className="field">
              <span>Company</span>
              <input value={form.company} onChange={(event) => update("company", event.target.value)} placeholder="Company name" maxLength="100" />
            </label>
            <label className="field">
              <span>Role</span>
              <input value={form.role} onChange={(event) => update("role", event.target.value)} placeholder="What they do" maxLength="100" />
            </label>
            <label className="field full-field">
              <span>A note to remember</span>
              <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Where you met, what you talked about…" rows="3" maxLength="1000" />
            </label>
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-footer">
            <span className="required-note"><b>*</b> Required</span>
            <div className="dialog-actions">
              <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={saving}>
                {saving ? "Saving…" : <><Check size={16} /> {contact ? "Save changes" : "Save contact"}</>}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function ContactCard({ contact, index, onEdit, onDelete, onFavorite }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="contact-card">
      <div className={`avatar avatar-${avatarColors[index % avatarColors.length]}`} aria-hidden="true">
        {initials(contact.name)}
      </div>
      <div className="contact-main">
        <div className="contact-name-row">
          <h3>{contact.name}</h3>
          {contact.favorite && <Star size={14} className="favorite-indicator" fill="currentColor" aria-label="Favorite" />}
        </div>
        <p className="contact-job">
          {contact.role || contact.company
            ? [contact.role, contact.company].filter(Boolean).join(" · ")
            : "No role or company added"}
        </p>
      </div>
      <div className="contact-details">
        {contact.email ? <a href={`mailto:${contact.email}`}><Mail size={15} />{contact.email}</a> : <span className="detail-muted"><Mail size={15} />No email</span>}
        {contact.phone ? <a href={`tel:${contact.phone}`}><Phone size={15} />{contact.phone}</a> : <span className="detail-muted"><Phone size={15} />No phone</span>}
      </div>
      <div className="contact-note" title={contact.notes || ""}>
        {contact.notes ? <span>“{contact.notes}”</span> : <span className="detail-muted">Add a personal note</span>}
      </div>
      <div className="card-actions">
        <button className={`icon-button favorite-button ${contact.favorite ? "is-favorite" : ""}`} onClick={() => onFavorite(contact)} aria-label={contact.favorite ? `Remove ${contact.name} from favorites` : `Add ${contact.name} to favorites`}>
          <Star size={17} fill={contact.favorite ? "currentColor" : "none"} />
        </button>
        <div className="menu-wrap">
          <button className="icon-button" onClick={() => setMenuOpen((open) => !open)} aria-label={`More actions for ${contact.name}`} aria-expanded={menuOpen}>
            <MoreHorizontal size={19} />
          </button>
          {menuOpen && (
            <div className="action-menu">
              <button onClick={() => { setMenuOpen(false); onEdit(contact); }}>Edit contact</button>
              <button className="delete-action" onClick={() => { setMenuOpen(false); onDelete(contact); }}>Delete contact</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [dialogContact, setDialogContact] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");

  async function loadContacts() {
    setLoading(true);
    setLoadError("");
    try {
      setContacts(await request("/api/contacts"));
    } catch (error) {
      if (error.status === 401) {
        setAuthUser(null);
        setContacts([]);
        setDialogOpen(false);
        setDialogContact(null);
        setFilter("all");
        setSearch("");
        setAuthError(error.message);
      } else {
        setLoadError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function restoreSession() {
      try {
        const { user } = await request("/api/auth/me");
        setAuthUser(user);
        await loadContacts();
      } catch (error) {
        if (error.status !== 401) setAuthError(error.message);
      } finally {
        setAuthLoading(false);
      }
    }
    restoreSession();
  }, []);

  const favoriteCount = contacts.filter((contact) => contact.favorite).length;
  const visibleContacts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return contacts
      .filter((contact) => filter !== "favorites" || contact.favorite)
      .filter((contact) => {
        if (!normalizedSearch) return true;
        return [contact.name, contact.email, contact.phone, contact.company, contact.role]
          .some((value) => value?.toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => sort === "recent"
        ? new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        : a.name.localeCompare(b.name));
  }, [contacts, filter, search, sort]);

  function openDialog(contact = null) {
    setDialogContact(contact);
    setDialogError("");
    setDialogOpen(true);
  }

  async function authenticate(mode, email, password) {
    const { user } = await request(`/api/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuthError("");
    setAuthUser(user);
    await loadContacts();
  }

  async function logout() {
    try {
      await request("/api/auth/logout", { method: "POST" });
      setAuthUser(null);
      setContacts([]);
      setDialogOpen(false);
      setDialogContact(null);
      setFilter("all");
      setSearch("");
      setLoadError("");
      setAuthError("");
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function saveContact(form) {
    setSaving(true);
    setDialogError("");
    try {
      const saved = dialogContact
        ? await request(`/api/contacts/${dialogContact._id}`, { method: "PATCH", body: JSON.stringify(form) })
        : await request("/api/contacts", { method: "POST", body: JSON.stringify(form) });
      setContacts((current) => dialogContact
        ? current.map((item) => item._id === saved._id ? saved : item)
        : [...current, saved]);
      setDialogOpen(false);
    } catch (error) {
      setDialogError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite(contact) {
    try {
      const updated = await request(`/api/contacts/${contact._id}`, {
        method: "PATCH",
        body: JSON.stringify({ favorite: !contact.favorite }),
      });
      setContacts((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (error) {
      setLoadError(error.message);
    }
  }

  async function deleteContact(contact) {
    if (!window.confirm(`Delete ${contact.name} from your contacts? This can't be undone.`)) return;
    try {
      await request(`/api/contacts/${contact._id}`, { method: "DELETE" });
      setContacts((current) => current.filter((item) => item._id !== contact._id));
    } catch (error) {
      setLoadError(error.message);
    }
  }

  if (authLoading) {
    return <main className="auth-loading"><span className="loader" />Checking your space…</main>;
  }

  if (!authUser) {
    return <AuthScreen onAuthenticate={authenticate} error={authError} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="People home">
          <span className="brand-mark"><UsersRound size={20} strokeWidth={2.2} /></span>
          <span>people<span className="brand-period">.</span></span>
        </a>
        <div className="sidebar-label">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Contact views">
          <button className={`nav-item ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            <UsersRound size={17} /><span>All contacts</span><span className="nav-count">{contacts.length}</span>
          </button>
          <button className={`nav-item ${filter === "favorites" ? "active" : ""}`} onClick={() => setFilter("favorites")}>
            <Star size={17} /><span>Favorites</span><span className="nav-count">{favoriteCount}</span>
          </button>
        </nav>
        <div className="sidebar-note">
          <div className="note-icon"><CircleHelp size={17} /></div>
          <p>Good things happen when you stay in touch.</p>
          <span>Keep your people close.</span>
        </div>
        <div className="sidebar-bottom">
          <div className="profile-avatar">{initials(authUser.email).slice(0, 1)}</div>
          <div><strong>Your workspace</strong><span>{authUser.email}</span></div>
          <button className="icon-button logout-button" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Contacts</strong></div>
          <div className="topbar-right">
            <span className="sync-status"><span className="status-dot" /> All changes saved</span>
            <div className="topbar-avatar">{initials(authUser.email).slice(0, 1)}</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">YOUR CIRCLE, ALL IN ONE PLACE</p>
              <h1>Contacts<span className="title-period">.</span></h1>
              <p className="page-subtitle">The people who make your world go round.</p>
            </div>
            <button className="button button-primary add-button" onClick={() => openDialog()}>
              <Plus size={17} strokeWidth={2.4} /> Add contact
            </button>
          </section>

          <section className="stats-row" aria-label="Contact summary">
            <div className="stat-card">
              <div className="stat-icon stat-icon-lilac"><UsersRound size={19} /></div>
              <div><span className="stat-label">In your circle</span><strong>{contacts.length}</strong></div>
              <span className="stat-footnote">people</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-peach"><Star size={18} /></div>
              <div><span className="stat-label">Close to heart</span><strong>{favoriteCount}</strong></div>
              <span className="stat-footnote">favorites</span>
            </div>
            <div className="stat-card stat-card-tip">
              <div className="stat-icon stat-icon-mint"><BriefcaseBusiness size={18} /></div>
              <div><span className="stat-label">A little reminder</span><strong className="tip-text">Reach out today</strong></div>
              <span className="tip-sparkle">✳</span>
            </div>
          </section>

          <section className="contacts-section">
            <div className="section-heading">
              <div>
                <h2>{filter === "favorites" ? "Your favorites" : "Everyone"}</h2>
                <span className="section-count">{visibleContacts.length} {visibleContacts.length === 1 ? "person" : "people"}</span>
              </div>
              <div className="list-tools">
                <label className="search-box">
                  <Search size={17} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find someone…" aria-label="Search contacts" />
                  {search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}
                </label>
                <label className="sort-select">
                  {sort === "name" ? <SlidersHorizontal size={16} /> : <ArrowDownUp size={16} />}
                  <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort contacts">
                    <option value="name">Name</option>
                    <option value="recent">Recently updated</option>
                  </select>
                </label>
              </div>
            </div>

            {loadError && (
              <div className="error-banner" role="alert">
                <span>{loadError}</span>
                <button onClick={loadContacts}>Try again</button>
              </div>
            )}

            <div className="contact-list">
              {loading ? (
                <div className="list-message"><span className="loader" /> Gathering your people…</div>
              ) : visibleContacts.length ? (
                visibleContacts.map((contact, index) => (
                  <ContactCard key={contact._id} contact={contact} index={index} onEdit={openDialog} onDelete={deleteContact} onFavorite={toggleFavorite} />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-illustration"><UsersRound size={27} /></div>
                  <h3>{search ? "No one by that name" : filter === "favorites" ? "Your favorites will live here" : "Your circle starts here"}</h3>
                  <p>{search ? "Try a different name, email or company." : filter === "favorites" ? "Tap the star on a contact to keep them close." : "Add someone you’d like to keep in touch with."}</p>
                  {!search && filter === "all" && <button className="button button-secondary" onClick={() => openDialog()}><Plus size={16} /> Add your first contact</button>}
                </div>
              )}
            </div>
          </section>
          <footer className="page-footer"><span>Made for meaningful connections</span><span><span className="footer-heart">♥</span> Keep in touch</span></footer>
        </div>
      </main>

      {dialogOpen && <ContactDialog contact={dialogContact} onClose={() => setDialogOpen(false)} onSave={saveContact} saving={saving} error={dialogError} />}
    </div>
  );
}
