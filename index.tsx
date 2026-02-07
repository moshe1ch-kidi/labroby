import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import MissionEditor from './components/MissionEditor';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const RootComponent = () => {
    const [route, setRoute] = useState(window.location.hash);

    useEffect(() => {
        const handleHashChange = () => setRoute(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Simple Router: If hash is #editor, show Editor. Otherwise show App.
    if (route === '#editor') {
        return <MissionEditor />;
    }

    return <App />;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <RootComponent />
);
