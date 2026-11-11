import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
await build({
  entryPoints:[fileURLToPath(new URL('./client-source.js',import.meta.url))],
  outfile:fileURLToPath(new URL('../supabase-client.js',import.meta.url)),
  bundle:true,minify:true,platform:'browser',format:'iife',legalComments:'eof'
});
