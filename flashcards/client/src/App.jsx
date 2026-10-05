import { useEffect, useState } from 'react';
import StudentPortal from './pages/StudentPortal.jsx';
import InstructorPortal from './pages/InstructorPortal.jsx';

const current = () => (window.location.hash.startsWith('#/instructor') ? 'instructor' : 'student');

export default function App() {
  const [portal, setPortal] = useState(current);

  useEffect(() => {
    const onHash = () => setPortal(current());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-tape" />
          Flashcards
        </div>
        <nav>
          <a href="#/student" className={portal === 'student' ? 'active' : ''}>
            Student
          </a>
          <a href="#/instructor" className={portal === 'instructor' ? 'active' : ''}>
            Instructor
          </a>
        </nav>
      </header>
      <main className="container">
        {portal === 'student' ? <StudentPortal /> : <InstructorPortal />}
      </main>
    </div>
  );
}
