import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout/layout";

// Pages
import Home from "@/pages/home";
import AgroMap from "@/pages/agro-map";
import DiseaseDetector from "@/pages/disease-detector";
import QA from "@/pages/qa";
import FertilizerGuide from "@/pages/fertilizer-guide";
import Consultancy from "@/pages/consultancy";
import CropRecommendation from "@/pages/crop-recommendation";
import Marketplace from "@/pages/marketplace";
import KrishokCard from "@/pages/krishok-card";
import OrderTracking from "@/pages/orders";
import AIAssistant from "@/pages/ai-assistant";
import Weather from "@/pages/weather";
import SensorDashboard from "@/pages/sensor-dashboard";
import AnimalHealth from "@/pages/animal-health";
import LiveChat from "@/pages/live-chat";
import PrecisionAg from "@/pages/precision-ag";
import DroneMonitoring from "@/pages/drone-monitoring";
import MarketIntelligence from "@/pages/market-intelligence";
import SmartIrrigation from "@/pages/smart-irrigation";
import Dashboard from "@/pages/dashboard";
import IotAdmin from "@/pages/iot-admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/agro-map" component={AgroMap} />
        <Route path="/disease-detector" component={DiseaseDetector} />
        <Route path="/qa" component={QA} />
        <Route path="/fertilizer-guide" component={FertilizerGuide} />
        <Route path="/consultancy" component={Consultancy} />
        <Route path="/crop-recommendation" component={CropRecommendation} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/krishok-card" component={KrishokCard} />
        <Route path="/orders" component={OrderTracking} />
        <Route path="/ai-assistant" component={AIAssistant} />
        <Route path="/weather" component={Weather} />
        <Route path="/sensor-dashboard" component={SensorDashboard} />
        <Route path="/animal-health" component={AnimalHealth} />
        <Route path="/live-chat" component={LiveChat} />
        <Route path="/precision-ag" component={PrecisionAg} />
        <Route path="/drone-monitoring" component={DroneMonitoring} />
        <Route path="/market-intelligence" component={MarketIntelligence} />
        <Route path="/smart-irrigation" component={SmartIrrigation} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/iot-admin" component={IotAdmin} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="agrobangla-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <SonnerToaster position="top-center" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
