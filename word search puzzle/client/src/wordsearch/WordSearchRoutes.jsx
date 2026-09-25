import { Routes, Route } from 'react-router-dom';
import LearnerHome from './pages/LearnerHome.jsx';
import TrainerPortal from './pages/TrainerPortal.jsx';
import PuzzleEditor from './pages/PuzzleEditor.jsx';

// Mount this anywhere inside a host app's own router, e.g.
//   <Route path="/apps/word-search/*" element={<WordSearchRoutes />} />
// Every Link/route inside this module is relative, so it works correctly
// no matter what base path the host mounts it at - it never assumes it
// owns the whole app or the whole URL space.
export default function WordSearchRoutes() {
  return (
    <Routes>
      <Route index element={<LearnerHome />} />
      <Route path="trainer" element={<TrainerPortal />} />
      <Route path="trainer/puzzles/:puzzleId" element={<PuzzleEditor />} />
    </Routes>
  );
}
