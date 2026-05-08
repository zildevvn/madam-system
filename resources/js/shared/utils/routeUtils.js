import { matchPath } from 'react-router-dom';

/**
 * Route Matching Utilities
 * [WHY] Centralized route matching logic to ensure consistency across the app 
 * and avoid brittle manual string comparisons.
 */

/**
 * Checks if the current pathname matches a target path pattern.
 * @param {string} currentPath - The current window.location.pathname
 * @param {string} targetPath - The path pattern to match against (e.g., '/order/:id')
 * @param {boolean} exact - Whether to perform an exact match
 */
export const matchRoute = (currentPath, targetPath, exact = false) => {
    if (!targetPath || targetPath === '#') return false;
    
    // Handle query params or hashes if passed in targetPath
    const pathOnly = targetPath.split('?')[0].split('#')[0];
    
    return !!matchPath({ path: pathOnly, end: exact }, currentPath);
};

/**
 * Checks if the current pathname matches any of the provided path patterns.
 */
export const matchAnyRoute = (currentPath, paths, exact = false) => {
    return paths.some(path => matchRoute(currentPath, path, exact));
};
