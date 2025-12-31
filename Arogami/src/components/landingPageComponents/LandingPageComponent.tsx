// @ts-ignore
import React from 'react';
import styled from 'styled-components';
import { HeroSection } from "./HeroSection.tsx";
import { HeroSectionBottomDiv } from "./HeroSectionBottomDiv.tsx";
import '../../CSS/HeroSection.css';
import Footer from "../footer/Footer.tsx";
import MarqueeComponent from "./marquee/MarqueeComponent.tsx";
import WhoWeHelp from "./WhoWeHelp.tsx";
import OurSolution from "./OurSolution.tsx";
import OurServices from "./OurServices.tsx";
import ScrollVelocity from "../ui/scrollvelocity.tsx";

const Container = styled.div`
    display: flex;
    background-color: #F6F4F2;
    height: 100%;
    width: 100vw;
    margin: 0;
    padding: 0;
    position: relative;
    left: 50%;
    right: 50%;
    transform: translate(-50%, 0);
    flex-direction: column;
    gap: 5%;

    @media (max-width: 1440px) {
        gap: 3%;
    }
    @media (max-width: 1024px) {
        gap: 3%;
    }
    @media (max-width: 768px) {
        gap: 2%;
    }
    @media (max-width: 480px) {
        gap: 1%;
    }
`;

const LandingPageComponent = () => {
    return (
        <Container>
            <HeroSection />
            <HeroSectionBottomDiv />
            
            <WhoWeHelp/>
            <ScrollVelocity 
                texts={[
                    "Predict • Prevent • Protect •",
                    "Your Health, Our AI • Smart Care, Everywhere •",
                ]}
                velocity={80}
                className="font-bold text-green-800 pt-50 mt-16 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
                parallaxClassName="parallax"
                scrollerClassName="scroller"
            />
            <OurSolution/>
            <OurServices/>
            <Footer/>
        </Container>
    );
};

export default LandingPageComponent;
