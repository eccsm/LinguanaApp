/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Suppress known warnings
LogBox.ignoreLogs([
    'This method is deprecated', // Firebase v22 migration warnings
    'namespaced API', // Firebase v22 modular SDK migration
    'migration guide', // Firebase v22 migration guides
    'VirtualizedList: You have a large list', // Performance warning for large lists
    'Please use `getApp()`', // Firebase getApp deprecation
]);

// Completely suppress Firebase deprecation console.warn spam
const originalWarn = console.warn;
console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && (
        message.includes('This method is deprecated') ||
        message.includes('namespaced API') ||
        message.includes('migrating-to-v22')
    )) {
        return; // Suppress Firebase v22 deprecation warnings
    }
    originalWarn.apply(console, args);
};

AppRegistry.registerComponent(appName, () => App);
