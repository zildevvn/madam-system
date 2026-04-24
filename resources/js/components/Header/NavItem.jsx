import React from 'react';
import { Link } from 'react-router-dom';

/**
 * NavItem: Individual navigation link or expandable group.
 * WHY: Separated from Header to maintain component granularity and adhere to the <200 lines rule.
 */
const NavItem = ({ item, isActive, setSidebarOpen }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isAnyChildActive = hasChildren && item.children.some(child => isActive(child.href));
    const [expanded, setExpanded] = React.useState(isAnyChildActive);

    // [WHY] Synchronize expansion state with route changes (e.g. navigation via URL)
    React.useEffect(() => {
        if (isAnyChildActive) {
            setExpanded(true);
        }
    }, [isAnyChildActive]);

    return (
        <div className="flex flex-col">
            <Link
                to={item.href}
                onClick={(e) => {
                    setSidebarOpen(false);
                }}
                className={`flex items-center justify-between px-6 py-4 text-sm font-bold transition-all duration-300 group rounded-none border-r-2 ${isActive(item.href) || isAnyChildActive
                    ? 'bg-orange-50/50 text-orange-600 border-orange-500'
                    : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-semibold'
                    }`}
            >
                <span className="flex items-center gap-3">
                    {item.name}
                </span>
                {hasChildren && (
                    <div className={`icon-submenu p-1.5 rounded-lg transition-colors ${expanded ? 'bg-orange-100 text-orange-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                    >
                        <svg
                            className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3.5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                )}
            </Link>

            {hasChildren && (
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-60' : 'max-h-0'}`}>
                    <div className="bg-slate-50/20 flex flex-col py-1 ml-4 border-l border-slate-100">
                        {item.children.map((child) => {
                            const childActive = isActive(child.href);
                            return (
                                <Link
                                    key={child.name}
                                    to={child.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center pl-4 pr-4 py-3 text-[13px] font-bold transition-all duration-200 relative group ${childActive
                                        ? 'text-orange-600'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    {childActive && (
                                        <div className="absolute left-0 w-1 h-4 bg-orange-500 rounded-r-full" />
                                    )}
                                    {child.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(NavItem);
