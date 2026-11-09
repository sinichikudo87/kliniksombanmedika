import React from 'react';
import { CartoonNurseMascot } from './CartoonNurseMascot';

interface AnimatedHumanNurseProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGreeting?: boolean;
}

export const AnimatedHumanNurse: React.FC<AnimatedHumanNurseProps> = (props) => {
  return <CartoonNurseMascot {...props} />;
};

export const AnimatedCartoonNurse = AnimatedHumanNurse;
export default AnimatedHumanNurse;
