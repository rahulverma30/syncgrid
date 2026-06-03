const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const dirsToScan = ['app', 'components', 'features', 'hooks', 'store', 'services'];
const apiRouteRegex = /['"`](\/api\/[^'"`\?]+)/g;

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (filePath.includes(path.join('app', 'api'))) return; // Skip backend API files from frontend scrape
      walk(filePath, callback);
    } else if (
      filePath.endsWith('.ts') ||
      filePath.endsWith('.tsx') ||
      filePath.endsWith('.js') ||
      filePath.endsWith('.jsx')
    ) {
      callback(filePath);
    }
  }
}

const frontendApis = new Set();
const apiCalls = [];

dirsToScan.forEach((dir) => {
  walk(path.join(rootDir, dir), (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    let match;
    while ((match = apiRouteRegex.exec(content)) !== null) {
      // Check if it's actually an API call, not a definition of a route
      // To be safe, just collect all unique /api/ routes
      let route = match[1];
      // normalize dynamic segments by replacing variables ${...} with something else or keeping them.
      // Actually the regex `/api\/[^'"`\?]+/` will stop at `?` or quotes.
      // Let's strip out string interpolation patterns if possible
      route = route.replace(/\$\{.*?\}/g, '[id]');
      frontendApis.add(route);
      apiCalls.push({ file: path.relative(rootDir, filePath), route });
    }
  });
});

console.log(`Found ${frontendApis.size} unique frontend API routes referenced.`);

const existingBackendRoutes = new Set();
const apiDir = path.join(rootDir, 'app', 'api');

function getNextRoutes(dir, currentRoute = '/api') {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getNextRoutes(filePath, `${currentRoute}/${file}`);
    } else if (file === 'route.ts' || file === 'route.js') {
      existingBackendRoutes.add(currentRoute);
    }
  }
}

getNextRoutes(apiDir);
console.log(`Found ${existingBackendRoutes.size} existing backend API routes.`);

// Check for missing routes
// A frontend route like /api/protected/projects/[id] will match /api/protected/projects/[id]
const missingRoutes = [];
const missingApiCalls = [];

for (const apiCall of apiCalls) {
  let { file, route } = apiCall;

  // exact match
  let exists = existingBackendRoutes.has(route);

  if (!exists) {
    // try to see if a dynamic segment matches
    // e.g. /api/protected/projects/123 -> /api/protected/projects/[id]
    let matched = false;
    const routeParts = route.split('/').filter(Boolean); // ['api', 'protected', 'projects', '123']

    for (const existingRoute of existingBackendRoutes) {
      const existingParts = existingRoute.split('/').filter(Boolean);
      if (
        existingParts.length === routeParts.length ||
        (existingParts[existingParts.length - 1] === '[...nextauth]' &&
          routeParts.length >= existingParts.length)
      ) {
        let isMatch = true;
        for (let i = 0; i < existingParts.length; i++) {
          if (existingParts[i].startsWith('[') && existingParts[i].endsWith(']')) {
            // dynamic segment, ignore difference
            if (existingParts[i] === '[...nextauth]') {
              break; // matches everything after
            }
          } else if (existingParts[i] !== routeParts[i]) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      missingRoutes.push(route);
      missingApiCalls.push({ file, route });
    }
  }
}

console.log(`Found ${missingApiCalls.length} missing API calls.`);
const uniqueMissing = [...new Set(missingRoutes)];
console.log('Unique Missing routes:', uniqueMissing);

fs.writeFileSync(
  'scripts/audit_report.json',
  JSON.stringify(
    {
      frontendApis: [...frontendApis],
      existingBackendRoutes: [...existingBackendRoutes],
      missingApiCalls,
      uniqueMissing,
    },
    null,
    2
  )
);

console.log('Report written to scripts/audit_report.json');

if (uniqueMissing.length > 0) {
  console.error(
    `\n[ERROR] Found ${uniqueMissing.length} missing API routes referenced by the frontend.`
  );
  console.error('Build failed due to API inconsistencies.');
  process.exit(1);
} else {
  console.log('\n[SUCCESS] All frontend API calls are satisfied by backend routes.');
  process.exit(0);
}
