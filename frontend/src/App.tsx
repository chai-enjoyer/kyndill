import { Routes, Route } from 'react-router-dom';

function Home() {
  return (
    <main>
      <h1>Kyndill</h1>
      <p>Small flames, kept alive daily.</p>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
