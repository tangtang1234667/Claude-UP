import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Articles from './pages/Articles.jsx';
import Vocabulary from './pages/Vocabulary.jsx';
import Practice from './pages/Practice.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/practice" element={<Practice />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
