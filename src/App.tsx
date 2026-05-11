import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import PatientHome from "./pages/patient/PatientHome.tsx";
import PatientTriage from "./pages/patient/PatientTriage.tsx";
import PatientResult from "./pages/patient/PatientResult.tsx";
import AshaHome from "./pages/asha/AshaHome.tsx";
import AshaVisits from "./pages/asha/AshaVisits.tsx";
import AshaVisit from "./pages/asha/AshaVisit.tsx";
import AshaAlerts from "./pages/asha/AshaAlerts.tsx";
import AshaProfile from "./pages/asha/AshaProfile.tsx";
import AshaSchedule from "./pages/asha/AshaSchedule.tsx";
import AshaReferrals from "./pages/asha/AshaReferrals.tsx";
import AshaStock from "./pages/asha/AshaStock.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/patient/home" element={<PatientHome />} />
          <Route path="/patient/triage" element={<PatientTriage />} />
          <Route path="/patient/result" element={<PatientResult />} />
          <Route path="/asha/home" element={<AshaHome />} />
          <Route path="/asha/visits" element={<AshaVisits />} />
          <Route path="/asha/visit/:id" element={<AshaVisit />} />
          <Route path="/asha/alerts" element={<AshaAlerts />} />
          <Route path="/asha/profile" element={<AshaProfile />} />
          <Route path="/asha/schedule" element={<AshaSchedule />} />
          <Route path="/asha/referrals" element={<AshaReferrals />} />
          <Route path="/asha/stock" element={<AshaStock />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
