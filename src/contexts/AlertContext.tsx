/**
 * AlertContext - Global alert provider with imperative API
 * Drop-in replacement for Alert.alert with themed modals
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ThemedAlert from '../components/common/ThemedAlert';

// Button interface matching React Native's Alert.alert
interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

// Extended options for themed alerts
interface AlertOptions {
    type?: 'info' | 'success' | 'warning' | 'error' | 'question';
    cancelable?: boolean;
}

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
    options: AlertOptions;
}

interface AlertContextType {
    showAlert: (
        title: string,
        message?: string,
        buttons?: AlertButton[],
        options?: AlertOptions
    ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = (): AlertContextType => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within AlertProvider');
    }
    return context;
};

interface AlertProviderProps {
    children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
    const [alertState, setAlertState] = useState<AlertState>({
        visible: false,
        title: '',
        message: '',
        buttons: [],
        options: {},
    });

    const showAlert = useCallback(
        (
            title: string,
            message: string = '',
            buttons: AlertButton[] = [{ text: 'OK' }],
            options: AlertOptions = {}
        ) => {
            // Auto-detect alert type from title/message if not specified
            let detectedType = options.type;
            if (!detectedType) {
                const content = (title + ' ' + message).toLowerCase();
                if (content.includes('error') || content.includes('failed') || content.includes('invalid')) {
                    detectedType = 'error';
                } else if (content.includes('success') || content.includes('✓') || content.includes('🎉')) {
                    detectedType = 'success';
                } else if (content.includes('warning') || content.includes('⚠')) {
                    detectedType = 'warning';
                } else if (content.includes('?') || content.includes('confirm') || content.includes('sure')) {
                    detectedType = 'question';
                } else {
                    detectedType = 'info';
                }
            }

            setAlertState({
                visible: true,
                title,
                message,
                buttons,
                options: { ...options, type: detectedType },
            });
        },
        []
    );

    const handleDismiss = useCallback(() => {
        setAlertState(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <ThemedAlert
                visible={alertState.visible}
                title={alertState.title}
                message={alertState.message}
                buttons={alertState.buttons}
                options={alertState.options}
                onDismiss={handleDismiss}
            />
        </AlertContext.Provider>
    );
};

export default AlertProvider;
