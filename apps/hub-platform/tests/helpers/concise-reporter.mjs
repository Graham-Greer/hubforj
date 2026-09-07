// Preserve useful full-suite evidence without dumping entire source assertion inputs.
export default async function* report(source) {
  for await (const event of source) {
    if (event.type === "test:fail") {
      const error = event.data.details?.error;
      const message = String(error?.cause?.message || error?.message || "").split("\n")[0];
      yield `${JSON.stringify({ result: "fail", name: event.data.name, file: event.data.file, message })}\n`;
    }
    if (event.type === "test:summary" && !event.data.file) yield `${JSON.stringify({ result: "summary", ...event.data })}\n`;
  }
}
