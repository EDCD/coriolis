/**
 * generate-announcements.js
 *
 * Reads ChangeLog.md and package.json to generate src/app/data/announcements.json
 * Run at build time or as part of the promotion workflow.
 */
const fs = require('fs');
const path = require('path');

const changelogPath = path.join(__dirname, 'ChangeLog.md');
const outputPath = path.join(__dirname, 'src', 'app', 'data', 'announcements.json');

const changelog = fs.readFileSync(changelogPath, 'utf8');

// Parse changelog entries: #X.Y.Z followed by bullet points
const entries = [];
const sections = changelog.split(/^#(?=\d)/m).filter(Boolean);

sections.forEach((section, index) => {
  const lines = section.trim().split('\n');
  const version = lines[0].trim();
  const bullets = lines.slice(1)
    .map(l => l.replace(/^\s*\*\s*/, '').trim())
    .filter(Boolean);

  if (version && bullets.length > 0) {
    // Split version into major, minor, patch, using . as the separator
    const parts = version.split('.');
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    const patch = parseInt(parts[2], 10);
    // Only include announcements from version 4.0.9 onwards
    if (major > 4 || (major === 4 && minor > 0) || (major === 4 && minor === 0 && patch >= 9)) {
      entries.push({
        id: sections.length - index,
        version: version,
        text: bullets[0], // First bullet as the tagline
        changes: bullets
      });
    };
  };
});

// Output all entries (announcements modal shows last 7, changelog shows all)
const announcements = entries;

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(announcements, null, 2));
console.log(`Generated ${announcements.length} announcements from ChangeLog.md`);
