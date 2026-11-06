import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import SignInModal from "./components/SignInModal.jsx";
import Landing from "./pages/Landing.jsx";
import Challenges from "./pages/Challenges.jsx";
import Workspace from "./pages/Workspace.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Instructor from "./pages/Instructor.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/challenges/:slug" element={<Workspace />} />
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/instructor" element={<Instructor />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <SignInModal />
    </>
  );
}
