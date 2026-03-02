import Surface from "../../primitives/surface/Surface";

export default function Card({ as = "div", tone = "default", elevation = "sm", interactive = false, padding = "4", radius = "lg", className = "", children, ...rest }) {
  return (
    <Surface
      as={as}
      tone={tone}
      elevation={elevation}
      border
      padding={padding}
      radius={radius}
      className={className}
      data-interactive={interactive ? "true" : "false"}
      {...rest}
    >
      {children}
    </Surface>
  );
}
