import Journal from '../pages/Journal';
import Reflect from '../pages/Reflect';
import Recall from '../pages/Recall';
import Settings from '../pages/Settings';
import Onboarding from '../pages/Onboarding';

const routes = [
  { path: '/', element: <Journal /> },
  { path: '/reflect', element: <Reflect /> },
  { path: '/recall', element: <Recall /> },
  { path: '/settings', element: <Settings /> },
  { path: '/onboarding', element: <Onboarding /> },
];

export default routes;
