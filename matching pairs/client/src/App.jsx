import { BrowserRouter } from 'react-router-dom';
import MatchingPairsModule from './MatchingPairsModule.jsx';

// Standalone dev/preview harness only (this is what `npm run dev` boots).
// It exists purely so the module can be run and clicked through on its
// own - it is NOT part of the reusable module itself. When this feature
// is embedded in the main school system, the host mounts
// <MatchingPairsModule /> inside its own router instead of this file.
function App() {
  return (
    <BrowserRouter>
      <MatchingPairsModule />
    </BrowserRouter>
  );
}

export default App;
