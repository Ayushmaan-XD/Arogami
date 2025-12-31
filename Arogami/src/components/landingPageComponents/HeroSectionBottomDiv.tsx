import BlurFade from "../magicui/blur-fade.tsx";
// import Ripple from "./magicui/ripple.tsx";

export function HeroSectionBottomDiv() {
  return (
    <BlurFade delay={1.5} duration={0.6} blur="2px">
      <div className="flex justify-center px-4 md:px-6 lg:px-10">
        {/* Design for all screens */}
        
          <img
            src="/bg/Arogami-homepage1.png"
            alt="Arogami Healthcare Platform"
            className="w-full h-full object-contain rounded-[12px]"
            style={{
              maxWidth: "1360px",
              maxHeight: "753px",
            }}
          />
        
        {/*<Ripple numCircles={16} mainCircleOpacity={1}/>*/}
      </div>
    </BlurFade>
  );
}
