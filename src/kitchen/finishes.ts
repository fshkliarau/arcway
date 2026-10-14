import { createContext, useContext } from 'react';
import { CURRENT_FINISHES, type Finishes } from '../decisions';

// The finishes the scene renders right now (current spec, or a hovered preview).
export const FinishesContext = createContext<Finishes>(CURRENT_FINISHES);
export const useFinishes = () => useContext(FinishesContext);
