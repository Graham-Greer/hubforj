import SectionContainer from "@/components/sections/section-container/SectionContainer";

export default function HeaderContainer({ width = "default", className = "", children }) {
  return (
    <SectionContainer width={width} className={className}>
      {children}
    </SectionContainer>
  );
}
