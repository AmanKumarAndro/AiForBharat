/**
 * @format
 */

import 'web-streams-polyfill/polyfill'; // Polyfill for TransformStream missing in React Native Core

// Polyfill for AWS SDK uuid dependency missing crypto in React Native
if (typeof global.crypto === 'undefined') {
    global.crypto = {
        getRandomValues: function (buffer) {
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] = Math.floor(Math.random() * 256);
            }
            return buffer;
        }
    };
}

// Polyfill for AWS SDK structuredClone missing in React Native Core
if (typeof global.structuredClone === 'undefined') {
    global.structuredClone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
