import React from 'react';
import Icon from './Icon';

/**
 * SearchableSelect Component
 * [WHY] Standardizes searchable select elements across the codebase.
 */
const SearchableSelect = ({ 
    options, 
    value, 
    onChange, 
    placeholder = 'Select option...', 
    searchPlaceholder = 'Search...', 
    emptyMessage = 'No options found', 
    isLegacy, 
    legacyName, 
    inputClasses 
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [highlightedIndex, setHighlightedIndex] = React.useState(0);
    const containerRef = React.useRef(null);

    const selectedOption = React.useMemo(() => {
        return options.find(opt => String(opt.id) === String(value)) || null;
    }, [options, value]);

    // Close when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options;
        const query = searchQuery.toLowerCase();
        return options.filter(opt => opt.name.toLowerCase().includes(query));
    }, [options, searchQuery]);

    // Reset highlighted index when filtered options change
    React.useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredOptions]);

    const handleSelect = (id, name) => {
        onChange(id, name);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) => 
                    filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => 
                    filteredOptions.length > 0 ? (prev - 1 + filteredOptions.length) % filteredOptions.length : 0
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredOptions.length > 0 && filteredOptions[highlightedIndex]) {
                    const opt = filteredOptions[highlightedIndex];
                    handleSelect(opt.id, opt.name);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative w-full focus:outline-none" onKeyDown={handleKeyDown} tabIndex={0}>
            {/* Trigger input/button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`${inputClasses} flex items-center justify-between cursor-pointer min-h-[46px] select-none`}
            >
                <span className={`text-[14px] truncate ${!selectedOption && !isLegacy ? 'text-gray-400' : 'text-gray-800'}`}>
                    {selectedOption 
                        ? selectedOption.name 
                        : (isLegacy ? `${legacyName} (Legacy)` : placeholder)
                    }
                </span>
                <Icon name="chevronDown" size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 right-0 z-[100] mt-1 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                        <Icon name="search" size={14} className="text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full bg-transparent border-none text-[13px] outline-none text-gray-800 font-medium"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                // Prevent search input keydown from bubbling up for ArrowDown/ArrowUp/Enter
                                if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
                                    e.preventDefault();
                                    handleKeyDown(e);
                                }
                            }}
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchQuery('');
                                }}
                                className="p-1 hover:bg-gray-100 rounded-md border-none bg-transparent cursor-pointer"
                            >
                                <Icon name="close" size={12} className="text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                        {isLegacy && !value && (
                            <div className="px-3 py-2 text-[13px] font-medium text-gray-400 bg-gray-50 italic">
                                {legacyName} (Legacy - Vui lòng chọn đối tác mới)
                            </div>
                        )}
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-4 text-[12px] text-center text-gray-400 font-bold uppercase tracking-wider">
                                {emptyMessage}
                            </div>
                        ) : (
                            filteredOptions.map((opt, idx) => {
                                const isSelected = String(opt.id) === String(value);
                                const isHighlighted = idx === highlightedIndex;
                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => handleSelect(opt.id, opt.name)}
                                        className={`px-3 py-2.5 text-[13px] font-semibold cursor-pointer transition-colors flex items-center justify-between ${
                                            isSelected 
                                                ? 'bg-orange-50 text-orange-600 font-black' 
                                                : isHighlighted
                                                    ? 'bg-gray-100 text-gray-900'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="truncate">{opt.name}</span>
                                        {isSelected && <Icon name="check" size={14} className="text-orange-500 shrink-0" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
