// Polyfill for global (needed for simple-peer and other Node.js modules)
if (typeof global === 'undefined') {
  window.global = globalThis;
}

// Polyfills for Node.js modules used by simple-peer
if (typeof window !== 'undefined') {
  // Events polyfill
  if (!window.EventEmitter) {
    window.EventEmitter = class EventEmitter {
      constructor() {
        this._events = {};
      }
      on(event, listener) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(listener);
        return this;
      }
      emit(event, ...args) {
        if (this._events[event]) {
          this._events[event].forEach(listener => listener(...args));
        }
        return this;
      }
      removeListener(event, listener) {
        if (this._events[event]) {
          this._events[event] = this._events[event].filter(l => l !== listener);
        }
        return this;
      }
    };
  }
  
  // Util polyfill
  if (!window.util) {
    window.util = {
      debuglog: () => () => {},
      inspect: (obj) => JSON.stringify(obj, null, 2)
    };
  }
  
  // Events module polyfill
  if (!window.events) {
    window.events = {
      EventEmitter: window.EventEmitter
    };
  }
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

