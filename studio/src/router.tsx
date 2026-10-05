import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import RaceReplay from './pages/RaceReplay';
import ExportSuite from './pages/ExportSuite';
import StoryEditor from './pages/StoryEditor';
import Login from './pages/Login';
import Releases from './pages/Releases';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'assets', element: <Assets /> },
      { path: 'replay/:raceId', element: <RaceReplay /> },
      { path: 'export/:raceId', element: <ExportSuite /> },
      { path: 'story/:raceId', element: <StoryEditor /> },
      { path: 'releases', element: <Releases /> },
    ],
  },
  { path: '/login', element: <Login /> },
]);