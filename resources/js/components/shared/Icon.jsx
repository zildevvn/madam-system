import React from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    ChevronDown,
    Pencil, 
    X, 
    LogOut, 
    Calendar, 
    Bell, 
    MessageSquare,
    Check,
    AlertCircle,
    User,
    Users,
    CheckCircle2,
    Loader2,
    Clock,
    XCircle,
    Search,
    Plus,
    Trash2,
    Eye,
    Sun,
    Moon,
    Briefcase
} from 'lucide-react';

export const ICONS = {
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
    chevronDown: ChevronDown,
    pencil: Pencil,
    close: X,
    logout: LogOut,
    calendar: Calendar,
    bell: Bell,
    message: MessageSquare,
    check: Check,
    alert: AlertCircle,
    user: User,
    users: Users,
    checkCircle: CheckCircle2,
    spinner: Loader2,
    clock: Clock,
    xCircle: XCircle,
    search: Search,
    plus: Plus,
    trash: Trash2,
    eye: Eye,
    sun: Sun,
    moon: Moon,
    briefcase: Briefcase
};

export default function Icon({ name, className = '', size = 18, strokeWidth = 2.5, ...props }) {
    const Component = ICONS[name];
    if (!Component) return null;
    return <Component className={className} size={size} strokeWidth={strokeWidth} {...props} />;
}
