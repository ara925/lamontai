const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all API route files
const routeFiles = glob.sync('src/app/api/**/*route.ts');

let updatedFiles = 0;

// Process each file
for (const file of routeFiles) {
  const content = fs.readFileSync(file, 'utf8');

  // Skip if file already has dynamic export
  if (content.includes('export const dynamic')) {
    continue;
  }

  // Only update files that use request properties
  if (content.includes('getUserIdFromRequest') || 
      content.includes('request.cookies') || 
      content.includes('request.headers') || 
      content.includes('cookies()') ||
      content.includes('searchParams') ||
      content.includes('NextRequest')) {
    
    // Determine runtime based on file path
    const isEdge = file.includes('/edge/') || 
                  file.includes('edge-') || 
                  content.includes('edge runtime');
    const runtime = isEdge ? 'edge' : 'nodejs';
    
    // Insert the dynamic and runtime exports after imports
    let updatedContent = content;
    
    // If runtime is already defined, don't add it again
    if (!content.includes('export const runtime')) {
      updatedContent = updatedContent.replace(
        /(import[^;]*;\s*(?:\/\/[^\n]*\s*)*)/,
        `$1\n// Specify the runtime\nexport const runtime = '${runtime}';\n`
      );
    }
    
    // Add dynamic export
    updatedContent = updatedContent.replace(
      /(import[^;]*;\s*(?:\/\/[^\n]*\s*)*(?:export const runtime[^;]*;\s*)?)/,
      `$1\n// Mark this route as dynamic since it accesses request properties\nexport const dynamic = 'force-dynamic';\n`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(file, updatedContent);
    updatedFiles++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Updated ${updatedFiles} files`); 