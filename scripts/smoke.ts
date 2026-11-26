/**
 * Smoke test against a running deployment. Read-only: only GET requests, no login, no data written.
 * Usage: pnpm smoke https://cherrystream.ch   (default: http://localhost:3000)
 */

type Check = {
  name: string;
  path: string;
  expect: (response: Response, body: string) => string | null;
};

const baseUrl = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

function expectStatus(...allowed: number[]) {
  return (response: Response) => (allowed.includes(response.status) ? null : `Status ${response.status}, erwartet ${allowed.join(" oder ")}`);
}

function redirectsToLogin(response: Response): string | null {
  const location = response.headers.get("location") ?? "";

  return response.status >= 300 && response.status < 400 && location.includes("/login") ? null : `Status ${response.status}, Ziel "${location}", erwartet Weiterleitung zum Login`;
}

const checks: Check[] = [
  {
    name: "Health-Check",
    path: "/api/health",
    expect: (response, body) => (response.status === 200 && body.includes('"ok"') ? null : `Status ${response.status}: ${body.slice(0, 80)}`),
  },
  { name: "Startseite", path: "/", expect: expectStatus(200) },
  { name: "Entdecken", path: "/explore", expect: expectStatus(200) },
  { name: "Login", path: "/login", expect: expectStatus(200) },
  { name: "Registrierung", path: "/register", expect: expectStatus(200) },
  { name: "Passwort vergessen", path: "/forgot-password", expect: expectStatus(200) },
  { name: "Impressum", path: "/imprint", expect: expectStatus(200) },
  { name: "Datenschutz", path: "/privacy", expect: expectStatus(200) },
  { name: "Nutzungsbedingungen", path: "/terms", expect: expectStatus(200) },
  {
    name: "Ungültiger Einladungslink",
    path: "/claim/ungueltiger-test-link-0000",
    expect: (response, body) => (response.status === 200 && body.includes("nicht mehr gültig") ? null : `Status ${response.status}, Hinweis fehlt`),
  },
  { name: "Dashboard geschützt", path: "/dashboard", expect: redirectsToLogin },
  { name: "Admin geschützt", path: "/admin", expect: redirectsToLogin },
  { name: "Admin-Bilder geschützt", path: "/api/admin/verifications/test/selfie", expect: expectStatus(404) },
  { name: "Cron ohne Secret abgewiesen", path: "/api/cron/cleanup", expect: expectStatus(401) },
  {
    name: "Sicherheits-Header",
    path: "/terms",
    expect: (response) => {
      const missing = ["x-frame-options", "x-content-type-options", "referrer-policy", "strict-transport-security"].filter((header) => !response.headers.has(header));

      return missing.length === 0 ? null : `Fehlt: ${missing.join(", ")}`;
    },
  },
];

async function run(): Promise<void> {
  console.log(`Rauchtest gegen ${baseUrl}\n`);

  let failures = 0;

  for (const check of checks) {
    const startedAt = performance.now();

    try {
      const response = await fetch(`${baseUrl}${check.path}`, {
        redirect: "manual",
      });
      const body = await response.text();
      const problem = check.expect(response, body);
      const duration = Math.round(performance.now() - startedAt);

      if (problem) {
        failures += 1;
        console.log(`✗ ${check.name.padEnd(36)} ${problem}`);
      } else {
        console.log(`✓ ${check.name.padEnd(36)} ${duration} ms`);
      }
    } catch (error) {
      failures += 1;
      console.log(`✗ ${check.name.padEnd(36)} ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(failures === 0 ? `\nAlle ${checks.length} Prüfungen bestanden.` : `\n${failures} von ${checks.length} Prüfungen fehlgeschlagen.`);
  console.log("Nicht automatisch geprüft: Login, Uploads, Videos, Mails. Dafür siehe docs/deploy.md.");

  process.exitCode = failures === 0 ? 0 : 1;
}

void run();

export {};
