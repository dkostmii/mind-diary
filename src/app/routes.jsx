import Journal from '../pages/Journal';
import Reflect from '../pages/Reflect';
import History from '../pages/History';
import Settings from '../pages/Settings';
import Onboarding from '../pages/Onboarding';

const routes = [
  { path: '/', element: <Journal /> },
  { path: '/reflect', element: <Reflect /> },
  { path: '/history', element: <History /> },
  { path: '/settings', element: <Settings /> },
  { path: '/onboarding', element: <Onboarding /> },
];

export default routes;
