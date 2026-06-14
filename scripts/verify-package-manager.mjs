const MIN_NODE = [22, 14, 0];
const MAX_NODE = [23, 0, 0];
const MIN_PNPM = [8, 6, 11];
const MAX_PNPM = [9, 0, 0];

const parseVersion = (value) => {
  const match = value.match(/^v?(\d+)\.(\d+)\.(\d+)/);

  if (!match) {
    return null;
  }

  return match.slice(1).map(Number);
};

const compareVersions = (left, right) => {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] > right[index]) {
      return 1;
    }

    if (left[index] < right[index]) {
      return -1;
    }
  }

  return 0;
};

const isInRange = (version, min, max) =>
  compareVersions(version, min) >= 0 && compareVersions(version, max) < 0;

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const nodeVersion = parseVersion(process.versions.node);

if (!nodeVersion || !isInRange(nodeVersion, MIN_NODE, MAX_NODE)) {
  fail("Node.js must satisfy >=22.14.0 <23. Use Volta or nvm before installing.");
}

const userAgent = process.env.npm_config_user_agent ?? "";
const pnpmMatch = userAgent.match(/pnpm\/(\d+\.\d+\.\d+)/);

if (!pnpmMatch) {
  fail(
    "Install dependencies with pnpm. Other package managers are intentionally blocked.",
  );
}

const pnpmVersion = parseVersion(pnpmMatch[1]);

if (!pnpmVersion || !isInRange(pnpmVersion, MIN_PNPM, MAX_PNPM)) {
  fail("pnpm must satisfy >=8.6.11 <9. Use Volta to select the pinned pnpm version.");
}
