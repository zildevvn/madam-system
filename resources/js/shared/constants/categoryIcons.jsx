import React from 'react';

/**
 * Shared category icons gallery.
 * extracted from Order.jsx and expanded for general use.
 */
export const CATEGORY_ICONS = {
    grid: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
        </svg>
    ),
    home: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    soup: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />
            <path d="M7 21h10" />
            <path d="M12 3v5" />
        </svg>
    ),
    flame: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.292 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
    ),
    box: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.2 3a2 2 0 0 1 1.8 1.1l4.2 8.5c.2.4.3.8.3 1.2v6.2a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-6.2c0-.4.1-.8.3-1.2l4.2-8.5A2 2 0 0 1 8.8 3h6.4z" />
            <path d="M6 12h12" />
        </svg>
    ),
    drink: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 22h8" />
            <path d="M7 10h10" />
            <path d="M12 15v7" />
            <path d="M12 15a5 5 0 0 0 5-5V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a5 5 0 0 0 5 5Z" />
        </svg>
    ),
    table: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15a7 7 0 0 0 7-7V4H5v4a7 7 0 0 0 7 7Z" />
            <path d="M12 15v7" />
            <path d="M7 22h10" />
            <path d="m2 2 20 20" />
        </svg>
    ),
    coffee: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><path d="M6 2v2" /><path d="M10 2v2" /><path d="M14 2v2" />
        </svg>
    ),
    pizza: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 11h.01" /><path d="M11 15h.01" /><path d="M16 16h.01" /><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16Z" /><path d="M22 22 2 16" />
        </svg>
    ),
    meat: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 10c0-2.5-2.5-4-5-4s-5 1.5-5 4c0 2 1.5 3 2.5 3.5s2.5 1 2.5 2.5v1.5a3 3 0 0 0 6 0v-1.5c0-1.5 1.5-2 2.5-2.5s2.5-1.5 2.5-3.5Z" /><path d="M11 17a2.5 2.5 0 0 1 5 0l-2.5 3.5L11 17Z" />
        </svg>
    ),
    leaf: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
    ),
    fish: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 12c.94-3.46 4.03-6 7.77-6a10.95 10.95 0 0 1 5.48 1.5L22 4.22a.5.5 0 0 1 .83.37v14.82a.5.5 0 0 1-.83.37l-2.25-3.28a10.95 10.95 0 0 1-5.48 1.5c-3.74 0-6.83-2.54-7.77-6Z" /><circle cx="15.5" cy="10.5" r=".5" /><path d="M16 16c-1.08-.27-2.6-.96-3-2.5" />
        </svg>
    ),
    dessert: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 11V7a5 5 0 0 1 10 0v4" /><path d="M11 11h2" /><rect x="3" y="11" width="18" height="8" rx="2" /><path d="M12 11v8" /><path d="M7 11v8" /><path d="M17 11v8" />
        </svg>
    ),
    wine: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 22h8" /><path d="M7 10h10" /><path d="M12 15v7" /><path d="M12 15a5 5 0 0 0 5-5V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a5 5 0 0 0 5 5Z" />
        </svg>
    ),
    beer: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 11h1a3 3 0 0 1 0 6h-1" /><path d="M5 6h12v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" /><path d="M5 10h12" /><path d="M5 15h12" /><path d="M12 2v2" /><path d="M8 2v2" /><path d="M16 2v2" />
        </svg>
    ),
    utensils: (props) => (
        <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
    )
};

export const DEFAULT_ICON = 'grid';

export const getIcon = (name, props = {}) => {
    const IconComponent = CATEGORY_ICONS[name] || CATEGORY_ICONS[DEFAULT_ICON];
    return <IconComponent {...props} />;
};
