import React from 'react';

const LogoSpinner = ({ fullPage = true }) => {
    const logoUrl = "https://i.imgur.com/SXiYUHr.png";
    
    return (
        <div className={`flex flex-col items-center justify-center ${fullPage ? 'h-full w-full py-20' : 'p-4'}`}>
            <style>
                {`
                @keyframes progress-slide {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(250%); }
                }
                .animate-progress {
                    animation: progress-slide 1.5s ease-in-out infinite;
                }
                `}
            </style>
            
            {/* Logo */}
            <div className="relative mb-6">
                <img 
                    src={logoUrl} 
                    alt="Turkish Kelleci Logo" 
                    className="w-24 h-24 object-contain"
                />
            </div>

            {/* Progress Bar Container */}
            <div 
                className="w-32 h-1 rounded-full overflow-hidden relative"
                style={{ backgroundColor: '#eeeeee' }}
            >
                {/* Slidding Bar */}
                <div 
                    className="absolute top-0 left-0 h-full w-12 rounded-full animate-progress"
                    style={{ backgroundColor: '#b02e0c' }}
                />
            </div>
        </div>
    );
};

export default LogoSpinner;
