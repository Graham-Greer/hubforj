import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRootPath = process.cwd();
const srcRootUrl = pathToFileURL(path.join(projectRootPath, "src") + path.sep);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const relativePath = specifier.slice(2);
    const resolvedUrl = new URL(relativePath, srcRootUrl);

    try {
      return await nextResolve(resolvedUrl.href, context);
    } catch (error) {
      if (error?.code !== "ERR_MODULE_NOT_FOUND" || path.extname(relativePath)) {
        throw error;
      }

      return nextResolve(`${resolvedUrl.href}.js`, context);
    }
  }

  return nextResolve(specifier, context);
}
