/**
 * Backend local de démonstration.
 *
 * Implémente le sous-ensemble de l'API Supabase utilisé par l'application
 * (auth + requêtes sur tables + rpc), persisté dans localStorage.
 * Utilisé automatiquement quand aucune vraie configuration Supabase n'existe.
 */

type Row = Record<string, unknown>;

interface LocalUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  created_at: string;
}

interface LocalDB {
  users: LocalUser[];
  tables: Record<string, Row[]>;
}

interface AuthUser {
  id: string;
  email: string;
  aud: string;
  app_metadata: Record<string, unknown>;
  user_metadata: { full_name: string };
  created_at: string;
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

// Instance d'Error pour que `err instanceof Error` fonctionne côté UI
class AuthError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

interface QueryError {
  code: string;
  message: string;
  details?: string;
}

interface QueryResult {
  data: unknown;
  error: QueryError | null;
  count?: number | null;
}

const DB_KEY = 'pingen_local_db_v1';
const SESSION_KEY = 'pingen_local_session_v1';

export const DEMO_EMAIL = 'demo@hrtech-studio.com';
export const DEMO_PASSWORD = 'Demo123!';

function uuid(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Persistance
// ---------------------------------------------------------------------------

function loadDb(): LocalDB {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      const db = JSON.parse(raw) as LocalDB;
      if (Array.isArray(db.users) && db.tables) {
        let changed = false;
        // Auto-réparation : recrée le compte démo s'il manque
        const demoUser = db.users.find((u) => u.email === DEMO_EMAIL);
        if (!demoUser) {
          seedDemoUser(db);
          changed = true;
        } else if (demoUser.password !== DEMO_PASSWORD) {
          // Répare un compte démo corrompu (évite "email/mdp incorrect" intermittent)
          demoUser.password = DEMO_PASSWORD;
          changed = true;
        }
        // Migration : ajoute des métriques aux pins publiés qui n'en ont pas
        for (const pin of tableOf(db, 'pins')) {
          if (pin.status === 'published' && typeof pin.impressions !== 'number') {
            pin.impressions = 150 + Math.round(Math.random() * 800);
            pin.saves = 10 + Math.round(Math.random() * 60);
            pin.clicks = 5 + Math.round(Math.random() * 40);
            changed = true;
          }
        }
        if (changed) persist(db);
        return db;
      }
    } catch {
      // base corrompue: on repart de zéro
    }
  }
  const db: LocalDB = {
    users: [],
    tables: {
      profiles: [],
      pins: [],
      pinterest_accounts: [],
      subscriptions: [],
      pin_analytics: [],
    },
  };
  seedDemoUser(db);
  persist(db);
  return db;
}

function persist(db: LocalDB): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function tableOf(db: LocalDB, name: string): Row[] {
  if (!db.tables[name]) db.tables[name] = [];
  return db.tables[name];
}

// ---------------------------------------------------------------------------
// Données de démonstration
// ---------------------------------------------------------------------------

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=600&fit=crop',
];

function seedUserData(db: LocalDB, user: LocalUser): void {
  tableOf(db, 'profiles').push({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: null,
    plan: 'starter',
    pins_created_this_month: 2,
    pinterest_accounts_connected: 1,
    created_at: user.created_at,
  });

  tableOf(db, 'pinterest_accounts').push({
    id: uuid(),
    user_id: user.id,
    pinterest_user_id: `pinterest_${user.id.slice(0, 8)}`,
    username: user.email.split('@')[0],
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    token_expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    boards: [
      { id: 'board_1', name: 'Inspiration Déco', description: 'Idées déco pour la maison', image_url: null, pin_count: 45 },
      { id: 'board_2', name: 'Recettes Faciles', description: 'Recettes rapides et délicieuses', image_url: null, pin_count: 128 },
    ],
    created_at: user.created_at,
  });

  const inHours = (h: number) => new Date(Date.now() + h * 3600 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 3600 * 1000).toISOString();

  const demoPins: Row[] = [
    {
      title: '10 Idées Déco pour Votre Salon',
      description: 'Transformez votre salon avec ces idées déco simples et abordables.',
      image_url: DEMO_IMAGES[0],
      board_name: 'Inspiration Déco',
      status: 'published',
      published_at: daysAgo(3),
      hashtags: ['#déco', '#salon', '#inspiration'],
      created_at: daysAgo(4),
      impressions: 12450,
      saves: 892,
      clicks: 456,
    },
    {
      title: 'Les Tendances Mode Printemps',
      description: 'Découvrez les pièces incontournables de la saison.',
      image_url: DEMO_IMAGES[3],
      board_name: 'Mode & Style',
      status: 'published',
      published_at: daysAgo(1),
      hashtags: ['#mode', '#tendances', '#printemps'],
      created_at: daysAgo(2),
      impressions: 6780,
      saves: 523,
      clicks: 267,
    },
    {
      title: 'Recette Facile : Tarte aux Pommes',
      description: 'Une tarte aux pommes croustillante en 30 minutes chrono.',
      image_url: DEMO_IMAGES[1],
      board_name: 'Recettes Faciles',
      status: 'scheduled',
      scheduled_at: inHours(5),
      hashtags: ['#recette', '#dessert', '#facile'],
      created_at: daysAgo(1),
    },
    {
      title: 'Comment Organiser son Bureau',
      description: '5 astuces pour un espace de travail productif et inspirant.',
      image_url: DEMO_IMAGES[2],
      board_name: 'Productivité',
      status: 'scheduled',
      scheduled_at: inHours(26),
      hashtags: ['#organisation', '#bureau', '#productivité'],
      created_at: daysAgo(1),
    },
    {
      title: 'Idées de Petit-Déjeuner Sain',
      description: 'Commencez la journée du bon pied avec ces recettes équilibrées.',
      image_url: DEMO_IMAGES[4],
      board_name: 'Recettes Faciles',
      status: 'draft',
      hashtags: ['#petitdéjeuner', '#healthy'],
      created_at: daysAgo(0.5),
    },
    {
      title: 'Jardin Vertical pour Petit Balcon',
      description: 'Créez un coin de verdure même dans un petit espace.',
      image_url: DEMO_IMAGES[5],
      board_name: 'Inspiration Déco',
      status: 'draft',
      hashtags: ['#jardin', '#balcon', '#plantes'],
      created_at: daysAgo(0.2),
    },
  ];

  const pins = tableOf(db, 'pins');
  for (const pin of demoPins) {
    pins.push({
      id: uuid(),
      user_id: user.id,
      link: null,
      board_id: 'board_1',
      scheduled_at: null,
      published_at: null,
      pinterest_pin_id: null,
      alt_text: pin.title,
      retry_count: 0,
      error_message: null,
      impressions: 0,
      saves: 0,
      clicks: 0,
      ...pin,
    });
  }

  const analytics = tableOf(db, 'pin_analytics');
  for (let d = 0; d < 14; d++) {
    const date = new Date(Date.now() - d * 24 * 3600 * 1000);
    analytics.push({
      id: uuid(),
      user_id: user.id,
      date: date.toISOString().slice(0, 10),
      impressions: 1200 + Math.round(Math.random() * 2200),
      saves: 80 + Math.round(Math.random() * 160),
      clicks: 40 + Math.round(Math.random() * 90),
    });
  }
}

function seedDemoUser(db: LocalDB): void {
  const demoUser: LocalUser = {
    id: uuid(),
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    full_name: 'Marie Démo',
    created_at: nowIso(),
  };
  db.users.push(demoUser);
  seedUserData(db, demoUser);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

type AuthListener = (event: string, session: AuthSession | null) => void;
const authListeners = new Set<AuthListener>();

function toAuthUser(user: LocalUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: { full_name: user.full_name },
    created_at: user.created_at,
  };
}

function createSession(user: LocalUser): AuthSession {
  const session: AuthSession = {
    access_token: `local-${uuid()}`,
    refresh_token: `local-${uuid()}`,
    expires_in: 3600 * 24 * 30,
    token_type: 'bearer',
    user: toAuthUser(user),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function notifyAuth(event: string, session: AuthSession | null): void {
  // Synchrone : évite navigate('/dashboard') avant que React ait isAuthenticated=true
  for (const listener of authListeners) {
    listener(event, session);
  }
}

const localAuth = {
  async getSession() {
    // Lit le storage APRÈS le yield : évite de renvoyer une session figée à null
    // si un login a eu lieu entre l'appel et la résolution de la promesse.
    await Promise.resolve();
    return { data: { session: getStoredSession() }, error: null };
  },

  async getUser() {
    await Promise.resolve();
    const session = getStoredSession();
    return { data: { user: session?.user ?? null }, error: null };
  },

  onAuthStateChange(callback: AuthListener) {
    authListeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => authListeners.delete(callback),
        },
      },
    };
  },

  async signUp(params: {
    email: string;
    password: string;
    options?: { data?: { full_name?: string } };
  }): Promise<{ data: { user: AuthUser | null; session: AuthSession | null }; error: AuthError | null }> {
    const db = loadDb();
    const email = params.email.trim().toLowerCase();

    if (db.users.some((u) => u.email === email)) {
      return {
        data: { user: null, session: null },
        error: new AuthError('Un compte existe déjà avec cet email. Connectez-vous.'),
      };
    }

    const user: LocalUser = {
      id: uuid(),
      email,
      password: params.password,
      full_name: params.options?.data?.full_name || email.split('@')[0],
      created_at: nowIso(),
    };
    db.users.push(user);
    seedUserData(db, user);
    persist(db);

    // Pas de confirmation email en mode démo: session immédiate
    const session = createSession(user);
    notifyAuth('SIGNED_IN', session);
    return { data: { user: session.user, session }, error: null };
  },

  async signInWithPassword(params: {
    email: string;
    password: string;
  }): Promise<{ data: { user: AuthUser | null; session: AuthSession | null }; error: AuthError | null }> {
    const db = loadDb();
    const email = params.email.trim().toLowerCase();
    const user = db.users.find((u) => u.email === email && u.password === params.password);

    if (!user) {
      return {
        data: { user: null, session: null },
        error: new AuthError('Email ou mot de passe incorrect.', 400),
      };
    }

    const session = createSession(user);
    notifyAuth('SIGNED_IN', session);
    return { data: { user: session.user, session }, error: null };
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    localStorage.removeItem(SESSION_KEY);
    notifyAuth('SIGNED_OUT', null);
    return { error: null };
  },
};

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';

interface Filter {
  column: string;
  op: FilterOp;
  value: unknown;
}

class LocalQueryBuilder implements PromiseLike<QueryResult> {
  private table: string;
  private operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private filters: Filter[] = [];
  private orderSpec: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private singleMode: boolean = false;
  private payload: Row[] | Row | null = null;
  private countExact = false;
  private headOnly = false;
  private joinPinterestAccounts = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string, options?: { count?: string; head?: boolean }): this {
    if (this.operation === 'select') {
      if (columns && columns.includes('pinterest_accounts')) {
        this.joinPinterestAccounts = true;
      }
      if (options?.count === 'exact') this.countExact = true;
      if (options?.head) this.headOnly = true;
    }
    // après insert/update, select() signifie "retourner les lignes"
    return this;
  }

  insert(rows: Row[] | Row): this {
    this.operation = 'insert';
    this.payload = rows;
    return this;
  }

  update(values: Row): this {
    this.operation = 'update';
    this.payload = values;
    return this;
  }

  upsert(rows: Row[] | Row): this {
    this.operation = 'upsert';
    this.payload = rows;
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, op: 'neq', value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ column, op: 'gt', value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ column, op: 'gte', value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ column, op: 'lt', value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ column, op: 'lte', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderSpec = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): this {
    this.singleMode = true;
    return this;
  }

  maybeSingle(): this {
    this.singleMode = true;
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled, onrejected);
  }

  private matches(row: Row): boolean {
    return this.filters.every((f) => {
      const v = row[f.column] as string | number | null;
      const fv = f.value as string | number | null;
      switch (f.op) {
        case 'eq': return v === fv;
        case 'neq': return v !== fv;
        case 'gt': return v !== null && fv !== null && v > fv;
        case 'gte': return v !== null && fv !== null && v >= fv;
        case 'lt': return v !== null && fv !== null && v < fv;
        case 'lte': return v !== null && fv !== null && v <= fv;
      }
    });
  }

  private execute(): QueryResult {
    const db = loadDb();
    const rows = tableOf(db, this.table);

    switch (this.operation) {
      case 'select': {
        let result = rows.filter((r) => this.matches(r));

        if (this.joinPinterestAccounts && this.table === 'pins') {
          const accounts = tableOf(db, 'pinterest_accounts');
          const joined: Row[] = [];
          for (const pin of result) {
            const account = accounts.find((a) => a.user_id === pin.user_id);
            if (account) {
              joined.push({ ...pin, pinterest_accounts: account });
            }
          }
          result = joined;
        }

        if (this.orderSpec) {
          const { column, ascending } = this.orderSpec;
          result = [...result].sort((a, b) => {
            const av = a[column] as string | number | null;
            const bv = b[column] as string | number | null;
            if (av === bv) return 0;
            if (av === null) return 1;
            if (bv === null) return -1;
            return (av < bv ? -1 : 1) * (ascending ? 1 : -1);
          });
        }

        if (this.limitCount !== null) {
          result = result.slice(0, this.limitCount);
        }

        if (this.countExact) {
          return { data: this.headOnly ? null : result, error: null, count: result.length };
        }

        if (this.singleMode) {
          if (result.length === 0) {
            return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
          }
          return { data: result[0], error: null };
        }

        return { data: result, error: null };
      }

      case 'insert': {
        const toInsert = (Array.isArray(this.payload) ? this.payload : [this.payload]) as Row[];
        const inserted = toInsert.map((row) => {
          const complete: Row = {
            id: uuid(),
            created_at: nowIso(),
            ...row,
          };
          rows.push(complete);
          return complete;
        });
        persist(db);
        const data = this.singleMode ? inserted[0] : inserted;
        return { data, error: null };
      }

      case 'update': {
        const values = this.payload as Row;
        const updated: Row[] = [];
        for (let i = 0; i < rows.length; i++) {
          if (this.matches(rows[i])) {
            rows[i] = { ...rows[i], ...values };
            updated.push(rows[i]);
          }
        }
        persist(db);
        if (this.singleMode) {
          if (updated.length === 0) {
            return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
          }
          return { data: updated[0], error: null };
        }
        return { data: updated, error: null };
      }

      case 'upsert': {
        const toUpsert = (Array.isArray(this.payload) ? this.payload : [this.payload]) as Row[];
        const result: Row[] = [];
        for (const row of toUpsert) {
          const idx = rows.findIndex((r) => r.id === row.id);
          if (idx >= 0) {
            rows[idx] = { ...rows[idx], ...row };
            result.push(rows[idx]);
          } else {
            const complete: Row = { id: uuid(), created_at: nowIso(), ...row };
            rows.push(complete);
            result.push(complete);
          }
        }
        persist(db);
        return { data: result, error: null };
      }

      case 'delete': {
        const remaining = rows.filter((r) => !this.matches(r));
        db.tables[this.table] = remaining;
        persist(db);
        return { data: null, error: null };
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

async function localRpc(fn: string, params?: Record<string, unknown>): Promise<QueryResult> {
  const db = loadDb();
  if (fn === 'increment_pin_count') {
    const profiles = tableOf(db, 'profiles');
    const profile = profiles.find((p) => p.id === params?.user_uuid);
    if (profile) {
      profile.pins_created_this_month = ((profile.pins_created_this_month as number) || 0) + 1;
      persist(db);
    }
    return { data: null, error: null };
  }
  return { data: null, error: { code: '42883', message: `Fonction inconnue: ${fn}` } };
}

/**
 * Simule une connexion OAuth (Google/GitHub) en mode démo :
 * crée le compte local au premier clic puis ouvre une session.
 */
export async function demoOAuthSignIn(provider: 'google' | 'github'): Promise<void> {
  const db = loadDb();
  const email = `${provider}@demo.pingenx.io`;
  let user = db.users.find((u) => u.email === email);

  if (!user) {
    user = {
      id: uuid(),
      email,
      password: uuid(),
      full_name: provider === 'google' ? 'Utilisateur Google' : 'Utilisateur GitHub',
      created_at: nowIso(),
    };
    db.users.push(user);
    seedUserData(db, user);
    persist(db);
  }

  const session = createSession(user);
  notifyAuth('SIGNED_IN', session);
}

export function createLocalSupabaseClient() {
  // Initialise la base (et le compte démo) dès la création du client
  loadDb();
  return {
    auth: localAuth,
    from: (table: string) => new LocalQueryBuilder(table),
    rpc: localRpc,
  };
}
