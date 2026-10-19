import { defineConfig } from "vite";

/*
 * "use client" é uma diretiva de React Server Components que react-router e
 * lucide-react trazem nos próprios arquivos. Este projeto não usa Server
 * Components, então ela é inofensiva aqui; só esse aviso, vindo de
 * node_modules, é silenciado. Qualquer outro aviso continua aparecendo.
 */
function ignorarUseClientDasDependencias(aviso, avisar) {
  const ehUseClient = aviso.code === "MODULE_LEVEL_DIRECTIVE" && aviso.message.includes('"use client"');
  const vemDeDependencia = (aviso.id ?? aviso.message).includes("node_modules");
  if (ehUseClient && vemDeDependencia) return;
  avisar(aviso);
}

export default defineConfig({
  build: {
    rollupOptions: {
      onwarn: ignorarUseClientDasDependencias,
    },
  },
});
