import { useNavigate } from 'react-router-dom';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';

export default function Onboarding() {
  const navigate = useNavigate();

  return <OnboardingFlow onComplete={() => navigate('/')} />;
}
