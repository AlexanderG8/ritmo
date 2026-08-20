import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * react-markdown pasa el nodo del AST a cada componente. No es un atributo DOM
 * válido y acaba en el HTML como node="[object Object]" si se propaga.
 */
function omitNode<T extends object>(props: T): Omit<T, "node"> {
  const rest = { ...props } as Record<string, unknown>;
  delete rest.node;
  return rest as Omit<T, "node">;
}

/**
 * Render de markdown.
 *
 * Cada componente recibe una prop `node` (el AST de react-markdown) que no es
 * un atributo DOM válido: se desestructura para que no acabe en el HTML. `react-markdown` no interpreta HTML embebido salvo que
 * se le pida, así que el contenido no puede inyectar marcado.
 *
 * No hay plugin de tipografía en el proyecto: los estilos se mapean a mano
 * con los tokens del sistema de diseño.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h2 className="text-base font-semibold tracking-tight" {...omitNode(props)} />
          ),
          h2: (props) => (
            <h3 className="text-base font-medium tracking-tight" {...omitNode(props)} />
          ),
          h3: (props) => (
            <h4 className="text-muted-foreground text-xs font-semibold tracking-[0.08em] uppercase" {...omitNode(props)} />
          ),
          p: (props) => <p className="text-pretty" {...omitNode(props)} />,
          ul: (props) => (
            <ul className="ml-4 flex list-disc flex-col gap-1" {...omitNode(props)} />
          ),
          ol: (props) => (
            <ol className="ml-4 flex list-decimal flex-col gap-1" {...omitNode(props)} />
          ),
          a: (props) => (
            <a
              className="underline underline-offset-2"
              target="_blank"
              rel="noreferrer noopener"
              {...omitNode(props)}
            />
          ),
          code: (props) => (
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs" {...omitNode(props)} />
          ),
          pre: (props) => (
            <pre className="bg-muted overflow-x-auto rounded-lg p-3 font-mono text-xs" {...omitNode(props)} />
          ),
          blockquote: (props) => (
            <blockquote className="border-border text-muted-foreground border-l-2 pl-3" {...omitNode(props)} />
          ),
          table: (props) => (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" {...omitNode(props)} />
            </div>
          ),
          th: (props) => (
            <th className="border-border border-b px-2 py-1 font-medium" {...omitNode(props)} />
          ),
          td: (props) => (
            <td className="border-border/60 border-b px-2 py-1" {...omitNode(props)} />
          ),
          hr: () => <hr className="border-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
