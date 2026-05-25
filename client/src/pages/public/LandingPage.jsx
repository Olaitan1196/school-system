import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import HeroSection from '../../components/public/HeroSection';
import FeaturesSection from '../../components/public/FeaturesSection';
import PortalsSection from '../../components/public/PortalsSection';
import StatsSection from '../../components/public/StatsSection';
import FooterSection from '../../components/public/FooterSection';

const LandingPage = () => {
    return (
        <div className="landing-page">
            <Navbar />
            <HeroSection />
            <StatsSection />
            <FeaturesSection />
            <PortalsSection />
            <FooterSection />
        </div>
    );
};

export default LandingPage;