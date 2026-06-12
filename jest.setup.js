import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// MOCK DE FRAMER MOTION: Le decimos a Jest que ignore las animaciones
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    // Agrega aquí otros elementos que uses, ej: p, span, etc.
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock del scrollIntoView que falta en JSDOM
window.HTMLElement.prototype.scrollIntoView = jest.fn();