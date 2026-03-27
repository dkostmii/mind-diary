import Main from '../pages/Main';
import Settings from '../pages/Settings';
import Onboarding from '../pages/Onboarding';

const routes = [
  { path: '/', element: <Main /> },
  { path: '/settings', element: <Settings /> },
  { path: '/onboarding', element: <Onboarding /> },
];

export default routes;
