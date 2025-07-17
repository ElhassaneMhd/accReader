#!/usr/bin/env node

/**
 * Script to update frontend configuration to use the new consolidated backend
 * This will replace all references to localhost:3999 with localhost:4000/api/pmta
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/store/slices/filesSlice.js',
  'src/store/slices/authSlice.js', 
  'src/services/mailwizz/mailwizzApi.js',
  'src/hooks/useEmailData.js',
  'src/hooks/useConnection.js'
];

const replacements = [
  // Basic API endpoint replacements
  {
    from: 'http://localhost:3999/api/files/available',
    to: 'http://localhost:4000/api/pmta/files/available'
  },
  {
    from: 'http://localhost:3999/api/files/import',
    to: 'http://localhost:4000/api/pmta/files/import'
  },
  {
    from: 'http://localhost:3999/api/files/import-latest-only',
    to: 'http://localhost:4000/api/pmta/files/import-latest-only'
  },
  {
    from: 'http://localhost:3999/api/files/select',
    to: 'http://localhost:4000/api/pmta/files/select'
  },
  {
    from: 'http://localhost:3999/api/files',
    to: 'http://localhost:4000/api/pmta/files'
  },
  {
    from: 'http://localhost:3999/api/latest-data',
    to: 'http://localhost:4000/api/pmta/latest-data'
  },
  {
    from: 'http://localhost:3999/api/import-status',
    to: 'http://localhost:4000/api/pmta/import-status'
  },
  {
    from: 'http://localhost:3999/api/connection-status',
    to: 'http://localhost:4000/api/pmta/connection-status'
  },
  {
    from: 'http://localhost:3999/api/connect',
    to: 'http://localhost:4000/api/pmta/connect'
  },
  {
    from: 'http://localhost:3999/api/disconnect',
    to: 'http://localhost:4000/api/pmta/disconnect'
  },
  // File delete pattern (with template literal)
  {
    from: '`http://localhost:3999/api/files/${filename}`',
    to: '`http://localhost:4000/api/pmta/files/${filename}`'
  },
  // API base URL patterns
  {
    from: 'http://localhost:3999',
    to: 'http://localhost:4000/api/pmta'
  },
  {
    from: '"http://localhost:3999"',
    to: '"http://localhost:4000"'
  },
  {
    from: "'http://localhost:3999'",
    to: "'http://localhost:4000'"
  },
  // API_BASE_URL constant
  {
    from: 'const API_BASE_URL = "http://localhost:3999";',
    to: 'const API_BASE_URL = "http://localhost:4000/api/pmta";'
  },
  // Auth endpoints should go to main API
  {
    from: 'http://localhost:4000/api/pmta/auth',
    to: 'http://localhost:4000/api/auth'
  },
  {
    from: 'http://localhost:4000/api/pmta/admin',
    to: 'http://localhost:4000/api/admin'
  }
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    replacements.forEach(replacement => {
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
        console.log(`✅ Updated: ${replacement.from} → ${replacement.to}`);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated file: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Updating frontend configuration for consolidated backend...\n');
  
  let totalUpdated = 0;
  
  filesToUpdate.forEach(file => {
    console.log(`\n📁 Processing: ${file}`);
    if (updateFile(file)) {
      totalUpdated++;
    }
  });
  
  console.log(`\n✅ Configuration update complete!`);
  console.log(`📊 Updated ${totalUpdated} out of ${filesToUpdate.length} files`);
  console.log(`\n🚀 You can now start your frontend and it will connect to the consolidated backend on port 4000`);
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, replacements };
