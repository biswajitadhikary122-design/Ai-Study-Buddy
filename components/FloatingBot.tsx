
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Avatar from './Avatar';
import { useTranslation } from '../contexts/LanguageContext';

interface FloatingBotProps {
    onOpen: () => void;
}

const FloatingBot: React.FC<FloatingBotProps> = ({ onOpen }) => {
    const { t } = useTranslation();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const botRef = useRef<HTMLButtonElement>(null);
    const offsetRef = useRef({ x: 0, y: 0 });
    const clickedRef = useRef(false);

    // Initialize position from localStorage or default to bottom-right
    useEffect(() => {
        const savedPosition = localStorage.getItem('floating-bot-position');
        if (savedPosition) {
            setPosition(JSON.parse(savedPosition));
        } else {
            const x = window.innerWidth - 88; // 64px width + 24px margin
            const y = window.innerHeight - 88; // 64px height + 24px margin
            setPosition({ x, y });
        }
    }, []);
    
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!botRef.current) return;
        clickedRef.current = true;
        setIsDragging(true);
        const rect = botRef.current.getBoundingClientRect();
        offsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        e.currentTarget.style.cursor = 'grabbing';
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        clickedRef.current = false; // It's a drag, not a click

        const newX = e.clientX - offsetRef.current.x;
        const newY = e.clientY - offsetRef.current.y;
        
        // Clamp position to stay within the viewport
        const clampedX = Math.max(0, Math.min(window.innerWidth - 64, newX));
        const clampedY = Math.max(0, Math.min(window.innerHeight - 64, newY));

        setPosition({ x: clampedX, y: clampedY });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        if (!isDragging) return;
        
        setIsDragging(false);
        if (botRef.current) {
            botRef.current.style.cursor = 'grab';
        }
        if (clickedRef.current) {
            onOpen();
        }
        // Save the final position using a functional update to get the latest state
        setPosition(currentPosition => {
            localStorage.setItem('floating-bot-position', JSON.stringify(currentPosition));
            return currentPosition;
        });
        clickedRef.current = false;
    }, [isDragging, onOpen]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <button
            ref={botRef}
            onMouseDown={handleMouseDown}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                touchAction: 'none', // Prevents scrolling on touch devices
            }}
            className="z-20 w-16 h-16 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 active:scale-100 cursor-grab"
            aria-label={t('aria_openBot')}
        >
            <Avatar isSpeaking={false} isLoading={false} isPaused={false} size="medium" />
        </button>
    );
};

export default FloatingBot;