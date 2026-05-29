import React from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Pencil, 
    X, 
    LogOut, 
    Calendar, 
    Bell, 
    MessageSquare,
    Check,
    AlertCircle,
    User,
    CheckCircle2,
    Loader2,
    Clock,
    XCircle
} from 'lucide-react';

export const ICONS = {
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
    pencil: Pencil,
    close: X,
    logout: LogOut,
    calendar: Calendar,
    bell: Bell,
    message: MessageSquare,
    check: Check,
    alert: AlertCircle,
    user: User,
    checkCircle: CheckCircle2,
    spinner: Loader2,
    clock: Clock,
    xCircle: XCircle
};

export default function Icon({ name, className = '', size = 18, strokeWidth = 2.5, ...props }) {
    const Component = ICONS[name];
    if (!Component) return null;
    return <Component className={className} size={size} strokeWidth={strokeWidth} {...props} />;
}
